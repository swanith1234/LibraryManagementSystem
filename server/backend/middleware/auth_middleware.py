from django.http import JsonResponse
from users.models import User
from backend.utils.auth_utils import decode_token

class JWTAuthenticationMiddleware:
    """
    Middleware to authenticate the user using JWT access token.
    Sets request.user except for exempt paths.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        # Add all routes that should NOT require JWT here
        self.exempt_paths = [
            '/swagger/',
            '/swagger.json',
            '/swagger.yaml',
            '/redoc/',
            '/admin/',
            "/api/users/login/",
            "/api/users/register/",
            "/api/users/refresh-token/",
            "/api/users/forgot-password/",
            "/api/users/reset-password/",
         
            "/admin/",  # optional
            "/healthcheck/",
        ]

    def __call__(self, request):
        print(request.path)
        # ✅ Skip authentication for exempt paths
        if any(request.path.startswith(path) for path in self.exempt_paths):
            return self.get_response(request)

        token = request.COOKIES.get("access_token") or request.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            token = token[7:]

        # decode_token should return a User object or None
        request.user = decode_token(token)

        if request.user is None:
            return JsonResponse({"error": "Invalid or expired token"}, status=401)
        
        return self.get_response(request)

# from django.http import JsonResponse
# from users.models import User
# from tenants.models import Tenant
# from backend.utils.auth_utils import decode_token
# from mongoengine import connect, disconnect
# from django.conf import settings


# class JWTAuthenticationMiddleware:
#     """
#     Middleware to authenticate both users and tenants using JWT access token.
#     Also dynamically switches the MongoDB connection based on tenant DB name.
#     """

#     def __init__(self, get_response):
#         self.get_response = get_response
#         self.exempt_paths = [
#             '/swagger/', '/swagger.json', '/swagger.yaml',
#             '/redoc/', '/admin/',
#             "/api/users/login/", "/api/users/register/",
#             "/api/users/forgot-password/", "/api/users/reset-password/",
#             "/api/tenants/register/", "/api/tenants/verify-email/",
#         ]

#     def __call__(self, request):
#         # Skip auth for public routes
#         if any(request.path.startswith(path) for path in self.exempt_paths):
#             return self.get_response(request)

#         token = request.COOKIES.get("access_token") or request.headers.get("Authorization")
#         if token and token.startswith("Bearer "):
#             token = token[7:]

#         user = decode_token(token)
#         if user is None:
#             return JsonResponse({"error": "Invalid or expired token"}, status=401)

#         request.user = user
#         request.user_type = "tenant" if isinstance(user, Tenant) else "user"

#         # 🔹 If this is a tenant, dynamically switch DB
#         if request.user_type == "tenant" and hasattr(user, "db_name"):
#             try:
#                 # Disconnect any existing default connection
#                 disconnect(alias="default")

#                 # Connect to the tenant-specific DB
#                 connect(
#                     db=user.db_name,
#                     alias="default",  # override default connection
#                     host=settings.MONGO_URI,
#                 )

#                 request.tenant_db = user.db_name  # optional, for logging/debugging

#             except Exception as e:
#                 return JsonResponse({"error": f"Database connection failed: {str(e)}"}, status=500)

#         # Continue the request
#         response = self.get_response(request)

#         # Cleanup (disconnect after response)
#         if hasattr(request, "tenant_db"):
#             disconnect(alias="default")

#         return response
