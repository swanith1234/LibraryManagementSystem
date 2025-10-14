from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import check_password, make_password
from users.models import User
from backend.utils.auth_utils import generate_access_token, generate_refresh_token, decode_token
from backend.utils.permissions import require_role
from backend.utils.pagination import paginate
from backend.utils.json_utils import to_dict, to_dict_list
import json
from mongoengine.queryset.visitor import Q
# -------------------------
# REGISTER USER
# -------------------------
@csrf_exempt
def register_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = json.loads(request.body)
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "member")

    if not email or not username or not password:
        return JsonResponse({"error": "Missing fields"}, status=400)
    if User.objects(email=email).first():
        return JsonResponse({"error": "Email already exists"}, status=400)

    user = User(
        email=email,
        username=username,
        password_hash=make_password(password),
        role=role
    )
    user.save()
    return JsonResponse({"message": "User registered successfully", "user": to_dict(user)}, status=201)


# -------------------------
# LOGIN USER
# -------------------------
@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = json.loads(request.body)
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return JsonResponse({"error": "Email and password are required"}, status=400)

    user = User.objects(email=email).first()
    if not user or not check_password(password, user.password_hash):
        return JsonResponse({"error": "Invalid credentials"}, status=401)
    print(user.id)
    access_token = generate_access_token((user.id))
    refresh_token = generate_refresh_token((user.id))

    response = JsonResponse({
        "message": "Login successful",
        "user": to_dict(user),
        "access_token": access_token,
        
    }, status=200)
    response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="Lax", max_age=60*15)
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=False, samesite="Lax", max_age=60*60*24*7)
    return response


# -------------------------
# GET PROFILE
# -------------------------
@csrf_exempt
def get_profile(request):
    user = getattr(request, "user", None)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    return JsonResponse(to_dict(user), status=200)


# -------------------------
# UPDATE PROFILE
# -------------------------
@csrf_exempt
def update_profile(request):
    user = getattr(request, "user", None)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    data = json.loads(request.body)
    if "password" in data:
        user.password_hash = make_password(data["password"])
    for field in ["username", "email", "full_name", "phone", "address", "profile_picture_url"]:
        if field in data:
            setattr(user, field, data[field])
    user.save()
    return JsonResponse({"message": "Profile updated successfully", "user": to_dict(user)}, status=200)


# -------------------------
# LOGOUT USER
# -------------------------
def logout_user(request):
    response = JsonResponse({"message": "Logged out successfully"}, status=200)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response


# -------------------------
# GET ALL USERS (ADMIN)
# -------------------------
@require_role("admin","librarian")
def get_all_users(request):
    users = User.objects.all()
    return JsonResponse({
        "count": users.count(),
        "users": to_dict_list(users)
    }, status=200)


# -------------------------
# GET BORROWED BOOKS (MEMBER)
# -------------------------

@csrf_exempt
def refresh_token_view(request):
    """
    Refresh the access token using a valid refresh token.
    The refresh token can come from cookie or body.
    """
    token = request.COOKIES.get("refresh_token") or json.loads(request.body).get("refresh_token")
    if not token:
        return JsonResponse({"error": "Refresh token is missing"}, status=400)

    user_id = decode_token(token)
    if not user_id:
        return JsonResponse({"error": "Invalid or expired refresh token"}, status=401)

    # Generate new access token
    new_access_token = generate_access_token(str(user_id))

    response = JsonResponse({"message": "Access token refreshed"}, status=200)
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=False,  # change True in production with HTTPS
        samesite="Lax",
        max_age=60 * 15
    )
    return response


@require_role("admin")
def filter_users(request):
    """
    Filters users by role, email, username, is_active
    Supports pagination via query params: page & limit
    Example: /api/users/filter/?role=member&page=2&limit=5
    """
    filters = {}

    # Filtering
    role = request.GET.get("role")
    email = request.GET.get("email")
    username = request.GET.get("username")
    is_active = request.GET.get("is_active")

    if role:
        filters["role"] = role
    if email:
        filters["email__icontains"] = email
    if username:
        filters["username__icontains"] = username
    if is_active:
        filters["is_active"] = is_active.lower() == "true"

    # Base queryset
    queryset = User.objects(**filters)

    # Pagination
    page = request.GET.get("page", 1)
    limit = request.GET.get("limit", 10)
    paginated = paginate(queryset, page, limit)

    return JsonResponse({
        "count": paginated["total"],
        "page": paginated["page"],
        "pages": paginated["pages"],
        "users": to_dict_list(paginated["items"])
    }, status=200)


from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
import secrets

# -------------------------
# UPDATE USER ROLE (ADMIN ONLY)
# -------------------------
@csrf_exempt
@require_role("admin")
def update_user_role(request, user_id):
    """
    Allows only admin to update the role of a specific user.
    Example: PATCH /api/users/role/<user_id>/
    Body: {"role": "admin" or "member" or "librarian"}
    """
    if request.method != "PATCH":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = json.loads(request.body)
    new_role = data.get("role")

    if new_role not in ["admin", "member", "librarian"]:
        return JsonResponse({"error": "Invalid role"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    user.role = new_role
    user.save()

    return JsonResponse({
        "message": f"Role updated successfully to '{new_role}'",
        "user": to_dict(user)
    }, status=200)


# -------------------------
# FORGOT PASSWORD
# -------------------------
@csrf_exempt
def forgot_password(request):
    """
    Allows user to reset their password via email.
    Sends a temporary reset token to the user's registered email.
    Example: POST /api/users/forgot-password/
    Body: {"email": "user@example.com"}
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = json.loads(request.body)
    email = data.get("email")

    if not email:
        return JsonResponse({"error": "Email is required"}, status=400)

    user = User.objects(email=email).first()
    if not user:
        return JsonResponse({"error": "User not found"}, status=404)

    # Generate a temporary token
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.save()

    # Construct reset URL (frontend should handle this link)
    reset_url = f"{request.build_absolute_uri('/reset-password/')}?token={reset_token}"

    # Send email (make sure settings.EMAIL_BACKEND & settings.DEFAULT_FROM_EMAIL are configured)
    try:
        send_mail(
            subject="Password Reset Request",
            message=f"Click the link below to reset your password:\n{reset_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        return JsonResponse({"error": f"Failed to send email: {str(e)}"}, status=500)

    return JsonResponse({"message": "Password reset link sent to your email."}, status=200)


# -------------------------
# RESET PASSWORD (AFTER EMAIL LINK)
# -------------------------
@csrf_exempt
def reset_password(request):
    """
    Endpoint to actually reset the password after verifying token.
    Example: POST /api/users/reset-password/
    Body: {"token": "<reset_token>", "new_password": "1234"}
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = json.loads(request.body)
    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return JsonResponse({"error": "Missing token or new password"}, status=400)

    user = User.objects(reset_token=token).first()
    if not user:
        return JsonResponse({"error": "Invalid or expired reset token"}, status=400)

    user.password_hash = make_password(new_password)
    user.reset_token = None
    user.save()

    return JsonResponse({"message": "Password reset successfully"}, status=200)
# -------------------------
# DELETE USER (ADMIN ONLY)
# -------------------------
@csrf_exempt
@require_role("admin")
def delete_user(request, user_id):
    """
    Allows only admin to delete a specific user account.
    Example: DELETE /api/users/delete/<user_id>/
    """
    if request.method != "DELETE":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    # Prevent admin from deleting themselves (optional safeguard)
    if str(request.user.id) == str(user.id):
        return JsonResponse({"error": "You cannot delete your own account."}, status=400)

    user.delete()
    return JsonResponse({"message": f"User '{user.username}' deleted successfully."}, status=200)
# library/utils.py or in your views



@csrf_exempt
def search_users(request):
    """
    Search users by username or email.
    Expects GET request with query parameter 'q'
    Returns JSON: { users: [...] }
    """
    if request.method != "GET":
        return JsonResponse({"error": "Only GET method allowed."}, status=405)

    query = request.GET.get("q", "").strip()
    if not query:
        return JsonResponse({"error": "Query parameter 'q' is required."}, status=400)

    # Search username or email (case-insensitive)
    results = User.objects.filter(
        __raw__={
            "$or": [
                {"username": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}},
            ]
        }
    )

    users_list = [
        {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
        }
        for user in results
    ]

    return JsonResponse({"users": users_list})

@require_role("admin", "librarian")
@csrf_exempt
def get_user_profile(request, user_id):
    """
    Fetch profile details for a specific user.
    Only accessible by admins and librarians.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    return JsonResponse({"user": to_dict(user)}, status=200)