from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from backend.utils.permissions import require_role
from backend.utils.pagination import paginate
from backend.utils.json_utils import to_dict, to_dict_list
from backend.utils.auth_utils import decode_token
from books.models import Book
from borrow.models import BorrowRecord
from users.models import User
import json
from datetime import datetime, timedelta

# -------------------------
# CREATE BORROW RECORD (MEMBER)
# -------------------------
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from backend.utils.permissions import require_role
from books.models import Book, BookCopy
from borrow.models import BorrowRecord
from users.models import User
from datetime import datetime, timedelta
import json, os


# -------------------------
# Helper: Calculate Fine
# -------------------------
@csrf_exempt
def calculate_fine(due_date, return_date=None):
    if not return_date:
        return_date = datetime.utcnow()
    fine_per_day = float(os.getenv("FINE_PER_DAY", 5))
    days_overdue = max(0, (return_date - due_date).days)
    return days_overdue * fine_per_day

@csrf_exempt
def get_fine(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
        borrow_id = data.get("borrow_id")
        if not borrow_id:
            return JsonResponse({"error": "borrow_id is required"}, status=400)

        # Fetch the borrow record
        borrow_record = BorrowRecord.objects(id=borrow_id).first()
        if not borrow_record:
            return JsonResponse({"error": "Borrow record not found."}, status=404)

        # Calculate fine using server-side due_date
        fine = calculate_fine(borrow_record.due_date)

        return JsonResponse({
            "borrow_id": borrow_id,
            "fine": fine
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
# -------------------------
# Borrow Book (Member)
# -------------------------
# @csrf_exempt
# @require_role("member")
# def borrow_book(request):
    
#     if request.method != "POST":
#         return JsonResponse({"error": "Invalid method"}, status=405)
    
#     try:
#         user = request.user  # ✅ Comes from JWTAuthenticationMiddleware
#         data = json.loads(request.body)
#         book_id = data.get("book_id")

#         if not book_id:
#             return JsonResponse({"error": "book_id is required"}, status=400)

#         book = Book.objects.get(id=book_id)
#         print("book",book)
#         # Borrow limits
#         MAX_BORROW_LIMIT = int(os.getenv("MAX_BORROW_LIMIT", 3))
#         BORROW_DAYS = int(os.getenv("BORROW_DAYS", 14))

#         # 1️⃣ Check active borrows
#         active_borrows = BorrowRecord.objects.filter(user=user, returned=False).count()
#         print("active_borrows",active_borrows)
#         if active_borrows >= MAX_BORROW_LIMIT:
#             return JsonResponse({"error": "Borrow limit reached."}, status=400)

#         # 2️⃣ Find available copy
#         available_copy = BookCopy.objects.filter(book=book, is_available=True, is_damaged=False).first()
#         if not available_copy:
#             if str(user.id) not in book.waitlist:
#                 book.waitlist.append(str(user.id))
#                 book.save()
#             return JsonResponse({"message": "No copies available. Added to waitlist."}, status=200)

#         # 3️⃣ Borrow record creation
#         borrow_record = BorrowRecord.objects.create(
#             user=user,
#             book=book,
#             copy=available_copy,
#             borrow_date=datetime.utcnow(),
#             due_date=datetime.utcnow() + timedelta(days=BORROW_DAYS),
#             returned=False,
#             fine=0.0,
#             fine_payment_status="Not Applicable"
#         )

#         # 4️⃣ Update copy & book status
#         available_copy.is_available = False
#         available_copy.last_borrowed_at = datetime.utcnow()
#         available_copy.save()
#         book.decrement_available()

#         return JsonResponse({
#             "message": "Book borrowed successfully.",
#             "borrow_id": str(borrow_record.id),
#             "book_title": book.title,
#             "barcode": available_copy.barcode,
#             "due_date": borrow_record.due_date
#         }, status=201)

#     except Exception as e:
#         return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_role("librarian")
def borrow_book(request):
    """
    API for librarians to lend a book copy to a specific user.
    Expects POST request with:
        - user_id
        - copy_id
    """
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        copy_id = data.get("copy_id")

        if not user_id or not copy_id:
            return JsonResponse({"error": "user_id and copy_id are required."}, status=400)

        # Fetch user and copy
        user = User.objects.get(id=user_id)
        copy = BookCopy.objects.get(id=copy_id)

        if not copy.is_available:
            return JsonResponse({"error": "Selected copy is not available."}, status=400)

        # Borrow limits for members (optional, can skip for librarian override)
        MAX_BORROW_LIMIT = int(os.getenv("MAX_BORROW_LIMIT", 3))
        active_borrows = BorrowRecord.objects.filter(user=user, returned=False).count()
        if active_borrows >= MAX_BORROW_LIMIT:
            return JsonResponse({"error": "User has reached borrow limit."}, status=400)

        # Borrow duration
        BORROW_DAYS = int(os.getenv("BORROW_DAYS", 14))

        # Create borrow record
        borrow_record = BorrowRecord.objects.create(
            user=user,
            book=copy.book,
            copy=copy,
            borrow_date=datetime.utcnow(),
            due_date=datetime.utcnow() + timedelta(days=BORROW_DAYS),
            returned=False,
            fine=0.0,
            fine_payment_status="Not Applicable"
        )

        # Update copy
        copy.is_available = False
        copy.last_borrowed_at = datetime.utcnow()
        copy.save()

        # Update book availability (assuming Book model has decrement_available())
        copy.book.decrement_available()

        return JsonResponse({
            "message": f"Book copy lent to {user.username} successfully.",
            "borrow_id": str(borrow_record.id),
            "book_title": copy.book.title,
            "barcode": copy.barcode,
            "due_date": borrow_record.due_date
        }, status=201)

    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)
    except BookCopy.DoesNotExist:
        return JsonResponse({"error": "Book copy not found."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# -------------------------
# Return Book (Member or Librarian)
# -------------------------
@csrf_exempt
@require_role('admin','librarian')
def return_book(request):
    if request.method != "PUT":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
        print("data", data)

        borrow_id = data.get("borrow_id")
        barcode = data.get("barcode")
        print("barcode", barcode)
        user_identifier = data.get("user_email") or data.get("username")
        print("user_identifier", user_identifier)
        condition = data.get("condition", "Good")
        remarks = data.get("remarks", "")
        fine_paid = data.get("fine_paid", False)

        borrow_record = None
        copy = None
        book = None

        # 1️⃣ Search by borrow_id if provided
        if borrow_id:
            borrow_record = BorrowRecord.objects(id=borrow_id, returned=False).first()
            if not borrow_record:
                return JsonResponse({"error": "No active borrow record found with this borrow_id."}, status=404)

            # ✅ Extract copy and book from borrow_record
            copy = borrow_record.copy
            book = borrow_record.book

        else:
            # 2️⃣ Otherwise search by barcode + user
            if not barcode or not user_identifier:
                return JsonResponse({"error": "Either borrow_id or (barcode + user_email/username) must be provided."}, status=400)

            # Identify user
            user = User.objects(__raw__={
                "$or": [
                    {"email": user_identifier},
                    {"username": user_identifier}
                ]
            }).first()
            if not user:
                return JsonResponse({"error": "User not found."}, status=404)

            # Identify copy
            copy = BookCopy.objects(barcode=barcode).first()
            if not copy:
                return JsonResponse({"error": "Invalid barcode."}, status=404)

            # Find active borrow record
            borrow_record = BorrowRecord.objects(user=user.id, copy=copy.id, returned=False).first()
            if not borrow_record:
                return JsonResponse({"error": "No active borrow record found."}, status=404)

            # ✅ Get book from record
            book = borrow_record.book

        # 3️⃣ Process return
        borrow_record.returned = True
        borrow_record.return_date = datetime.utcnow()
        borrow_record.book_condition_on_return = condition
        borrow_record.remarks_on_return = remarks

        # Calculate fine for this book
        fine = calculate_fine(borrow_record.due_date, borrow_record.return_date)
        borrow_record.fine = fine

        if fine > 0:
            borrow_record.fine_payment_status = "Paid" if fine_paid else "Pending"
        else:
            borrow_record.fine_payment_status = "Not Applicable"

        borrow_record.save()

        # ✅ 4️⃣ Update copy & book availability (always, for both cases)
        if copy:
            copy.is_available = True
            copy.condition = condition
            copy.is_damaged = (condition.lower() == "damaged")
            copy.save()

        if book:
            book.increment_copies()

        # 5️⃣ Notify next waitlist user (optional)
        if book and book.waitlist:
            next_user_id = book.waitlist.pop(0)
            book.save()
            # TODO: send async email notification to next_user_id

        return JsonResponse({
            "message": "Book returned successfully.",
            "borrow_id": str(borrow_record.id),
            "fine": fine,
            "fine_payment_status": borrow_record.fine_payment_status
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
@require_role("librarian","admin")
@csrf_exempt

def list_borrows(request):
    page = int(request.GET.get("page", 1))
    limit = int(request.GET.get("limit", 10))
    user_id = request.GET.get("user_id")
    book_id = request.GET.get("book_id")
    status = request.GET.get("status")  # active, returned, overdue

    filters = Q()
    if user_id:
        filters &= Q(user=user_id)
    if book_id:
        filters &= Q(book=book_id)
    if status == "active":
        filters &= Q(returned=False)
    elif status == "returned":
        filters &= Q(returned=True)
    elif status == "overdue":
        filters &= Q(returned=False, due_date__lt=datetime.utcnow())

    queryset = BorrowRecord.objects(filters).order_by("-borrow_date")

    total = queryset.count()
    start = (page - 1) * limit
    end = start + limit

    records = []
    for b in queryset[start:end]:
        records.append({
            "borrow_id": str(b.id),
            "book": b.book.title,
            "barcode": b.copy.barcode,
            "user": b.user.username,
            "borrow_date": b.borrow_date,
            "due_date": b.due_date,
            "returned": b.returned,
            "fine": b.fine,
            "condition": b.book_condition_on_return,
            "remarks": b.remarks_on_return
        })

    return JsonResponse({
        "total": total,
        "page": page,
        "limit": limit,
        "records": records
    })
@csrf_exempt
@require_role("member")
def member_borrow_summary(request):
    try:
        user = request.user  # ✅ from JWT middleware
        records = BorrowRecord.objects(user=user).order_by("-borrow_date")

        active_borrows = []
        returned_books = []

        for record in records:
            if not record.returned:
                active_borrows.append({
                    "book_title": record.book.title,
                    "barcode": record.copy.barcode,
                    "borrow_date": record.borrow_date,
                    "due_date": record.due_date,
                    "fine": calculate_fine(record.due_date)
                })
            else:
                returned_books.append({
                    "book_title": record.book.title,
                    "barcode": record.copy.barcode,
                    "borrow_date": record.borrow_date,
                    "return_date": record.return_date,
                    "fine": record.fine,
                    "fine_payment_status": record.fine_payment_status
                })

        return JsonResponse({
            "user": user.username,
            "active_borrows": active_borrows,
            "returned_books": returned_books
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_role("admin","librarian")
def librarian_view_member_summary(request, user_identifier):
    try:
        # Find user either by email or username
        user = User.objects(__raw__={
            "$or": [
                {"email": user_identifier},
                {"username": user_identifier}
            ]
        }).first()

        if not user:
            return JsonResponse({"error": "User not found"}, status=404)

        records = BorrowRecord.objects(user=user).order_by("-borrow_date")
        active_borrows = []
        returned_books = []

        for record in records:
            if not record.returned:
                active_borrows.append({
                    "book_title": record.book.title,
                    "barcode": record.copy.barcode,
                    "borrow_date": record.borrow_date,
                    "due_date": record.due_date,
                    "fine": calculate_fine(record.due_date)
                })
            else:
                returned_books.append({
                    "book_title": record.book.title,
                    "barcode": record.copy.barcode,
                    "borrow_date": record.borrow_date,
                    "return_date": record.return_date,
                    "fine": record.fine,
                    "fine_payment_status": record.fine_payment_status
                })

        return JsonResponse({
            "user": user.username,
            "active_borrows": active_borrows,
            "returned_books": returned_books
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_role("admin", "librarian")

def search_borrows(request):
    """
    Search borrow records using either:
      - username or user email
      - book copy barcode

    Optional query parameters:
      ?username=<username_or_email>
      ?barcode=<book_barcode>
      ?status=active|returned|overdue
    """
    if request.method != "GET":
        return JsonResponse({"error": "Invalid HTTP method"}, status=405)

    try:
        username = request.GET.get("username")
        barcode = request.GET.get("barcode")
        status = request.GET.get("status")

        # Start with all records
        filters = {}

        # ------------------------------
        # 🔍 Search by username or email
        # ------------------------------
        if username:
            user = User.objects(username=username).first() or User.objects(email=username).first()
            if not user:
                return JsonResponse({"count": 0, "results": []}, status=200)
            filters["user"] = user.id  # MongoEngine uses id for references

        # ------------------------------
        # 🔍 Search by book barcode
        # ------------------------------
        if barcode:
            copy = BookCopy.objects(barcode=barcode).first()
            if not copy:
                return JsonResponse({"count": 0, "results": []}, status=200)
            filters["copy"] = copy.id  # Use id

        # ------------------------------
        # 📘 Filter by status (optional)
        # ------------------------------
        now = datetime.utcnow()
        if status == "active":
            filters["returned"] = False
        elif status == "returned":
            filters["returned"] = True
        elif status == "overdue":
            filters["returned"] = False
            filters["due_date__lt"] = now

        # ------------------------------
        # If nothing provided, return empty list
        # ------------------------------
        if not username and not barcode:
            return JsonResponse({"count": 0, "results": []}, status=200)

        # ------------------------------
        # 📦 Fetch Records safely
        # ------------------------------
        borrow_records = BorrowRecord.objects(**filters).order_by("-borrow_date")

        results = []
        for record in borrow_records:
            results.append({
                "borrow_id": str(record.id),
                "user": record.user.username,
                "email": record.user.email,
                "book": record.book.title,
                "barcode": record.copy.barcode,
                "borrow_date": record.borrow_date.isoformat(),
                "due_date": record.due_date.isoformat(),
                "returned": record.returned,
                "return_date": record.return_date.isoformat() if record.return_date else None,
                "fine": record.fine,
                "fine_payment_status": record.fine_payment_status,
                "remarks": record.remarks_on_return or "",
                "condition_on_return": record.book_condition_on_return or ""
            })

        return JsonResponse({
            "count": len(results),
            "results": results
        }, status=200)

    except Exception as e:
        print("Error in search_borrows:", str(e))
        return JsonResponse({"error": "Internal Server Error"}, status=500)

@csrf_exempt

def get_user_borrow_history(request):
    """
    Fetch borrow records for a specific user.
    Security:
        - Members can fetch only their own records
        - Admins and librarians can fetch any user's records
    Returns:
        - records: list of all borrow records (both active and returned)
    Query params:
        - user_id (optional for admin/librarian, not needed for member)
        - page (optional, default=1)
        - limit (optional, default=10)
    """
    current_user = getattr(request, "user", None)
    if not current_user:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    # Get user_id from query params
    user_id = request.GET.get("user_id")
    
    # If member, force them to only see their own records
    if current_user.role == "member":
        user_id = str(current_user.id)
    elif not user_id:
        # If admin/librarian but no user_id provided, show their own
        user_id = str(current_user.id)

    # Member security check
    if current_user.role == "member" and user_id != str(current_user.id):
        return JsonResponse({"error": "Forbidden"}, status=403)

    try:
        # ✅ FIX: Use the User object directly instead of ObjectId
        user = User.objects(id=user_id).first()
        if not user:
            return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"Invalid user_id: {str(e)}"}, status=400)

    # Pagination
    page = int(request.GET.get("page", 1))
    limit = int(request.GET.get("limit", 100))  # Higher limit for profile page

    # ---------------------------
    # Fetch all borrow records
    # ---------------------------
    all_records_qs = BorrowRecord.objects(user=user).order_by("-borrow_date")
    
    total = all_records_qs.count()
    start = (page - 1) * limit
    end = start + limit
    
    records = []
    for b in all_records_qs[start:end]:
        record_data = {
            "_id": str(b.id),
            "book_title": b.book.title if b.book else "Unknown",
            "barcode": b.copy.barcode if b.copy else "Unknown",
            "borrow_date": b.borrow_date.isoformat() if b.borrow_date else None,
            "due_date": b.due_date.isoformat() if b.due_date else None,
            "return_date": b.return_date.isoformat() if b.return_date else None,
            "status": "returned" if b.returned else "borrowed",
            "returned": b.returned,
            "fine": b.fine if b.fine else 0.0,
            "condition_on_return": b.book_condition_on_return,
            "remarks": b.remarks_on_return
        }
        records.append(record_data)

    return JsonResponse({
        "records": records,
        "total": total,
        "page": page,
        "limit": limit
    }, status=200)