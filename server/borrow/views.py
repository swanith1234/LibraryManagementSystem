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
def calculate_fine(due_date, return_date=None):
    if not return_date:
        return_date = datetime.utcnow()
    fine_per_day = float(os.getenv("FINE_PER_DAY", 5))
    days_overdue = max(0, (return_date - due_date).days)
    return days_overdue * fine_per_day


# -------------------------
# Borrow Book (Member)
# -------------------------
@csrf_exempt
@require_role("member")
def borrow_book(request):
    
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)
    
    try:
        user = request.user  # ✅ Comes from JWTAuthenticationMiddleware
        data = json.loads(request.body)
        book_id = data.get("book_id")

        if not book_id:
            return JsonResponse({"error": "book_id is required"}, status=400)

        book = Book.objects.get(id=book_id)
        print("book",book)
        # Borrow limits
        MAX_BORROW_LIMIT = int(os.getenv("MAX_BORROW_LIMIT", 3))
        BORROW_DAYS = int(os.getenv("BORROW_DAYS", 14))

        # 1️⃣ Check active borrows
        active_borrows = BorrowRecord.objects.filter(user=user, returned=False).count()
        print("active_borrows",active_borrows)
        if active_borrows >= MAX_BORROW_LIMIT:
            return JsonResponse({"error": "Borrow limit reached."}, status=400)

        # 2️⃣ Find available copy
        available_copy = BookCopy.objects.filter(book=book, is_available=True, is_damaged=False).first()
        if not available_copy:
            if str(user.id) not in book.waitlist:
                book.waitlist.append(str(user.id))
                book.save()
            return JsonResponse({"message": "No copies available. Added to waitlist."}, status=200)

        # 3️⃣ Borrow record creation
        borrow_record = BorrowRecord.objects.create(
            user=user,
            book=book,
            copy=available_copy,
            borrow_date=datetime.utcnow(),
            due_date=datetime.utcnow() + timedelta(days=BORROW_DAYS),
            returned=False,
            fine=0.0,
            fine_payment_status="Not Applicable"
        )

        # 4️⃣ Update copy & book status
        available_copy.is_available = False
        available_copy.last_borrowed_at = datetime.utcnow()
        available_copy.save()
        book.decrement_available()

        return JsonResponse({
            "message": "Book borrowed successfully.",
            "borrow_id": str(borrow_record.id),
            "book_title": book.title,
            "barcode": available_copy.barcode,
            "due_date": borrow_record.due_date
        }, status=201)

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
        barcode = data.get("barcode")
        user_identifier = data.get("user_email") or data.get("username")
        condition = data.get("condition", "Good")
        remarks = data.get("remarks", "")
        fine_paid = data.get("fine_paid", False)

        if not barcode or not user_identifier:
            return JsonResponse({"error": "barcode and user_email/username are required."}, status=400)

        # 1️⃣ Identify user (MongoEngine syntax)
        user = User.objects(__raw__={
            "$or": [
                {"email": user_identifier},
                {"username": user_identifier}
            ]
        }).first()
        if not user:
            return JsonResponse({"error": "User not found."}, status=404)
        else:
            print("user:", user.to_mongo().to_dict())
        # 2️⃣ Identify copy
        copy = BookCopy.objects(barcode=barcode).first()
        if not copy:
            return JsonResponse({"error": "Invalid barcode."}, status=404)
        else:
            print("copy:", copy.to_mongo().to_dict())
        # 3️⃣ Find active borrow record
        print("user",user)
        record = BorrowRecord.objects().first()
        if record:
            print("record:", record.to_mongo().to_dict())

        borrow_record = BorrowRecord.objects(user=user.id, copy=copy.id, returned=False).first()
        if not borrow_record:
            return JsonResponse({"error": "No active borrow record found."}, status=404)

        # 4️⃣ Process return
        borrow_record.returned = True
        borrow_record.return_date = datetime.utcnow()
        borrow_record.book_condition_on_return = condition
        borrow_record.remarks_on_return = remarks

        fine = calculate_fine(borrow_record.due_date, borrow_record.return_date)
        borrow_record.fine = fine

        if fine > 0:
            borrow_record.fine_payment_status = "Paid" if fine_paid else "Pending"
        else:
            borrow_record.fine_payment_status = "Not Applicable"

        borrow_record.save()

        # 5️⃣ Update copy & book availability
        copy.is_available = True
        copy.condition = condition
        copy.is_damaged = (condition.lower() == "damaged")
        copy.save()

        book = borrow_record.book
        book.increment_copies()

        # 6️⃣ Notify next waitlist user (optional)
        if book.waitlist:
            next_user_id = book.waitlist.pop(0)
            book.save()
            # TODO: send async email notification to next_user_id

        return JsonResponse({
            "message": "Book returned successfully.",
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
            "copy": b.copy.barcode,
            "user": b.user.username,
            "borrow_date": b.borrow_date,
            "due_date": b.due_date,
            "returned": b.returned,
            "fine": calculate_fine(b.due_date),
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
