from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from mongoengine import DoesNotExist, ValidationError
from .models import Book, BookCopy
import json
from datetime import datetime
from backend.utils.permissions import require_role

# -----------------------------------
# Helper function for parsing JSON safely
# -----------------------------------
def parse_json(request):
    try:
        return json.loads(request.body.decode("utf-8"))
    except Exception:
        return None


# ==========================================================
# 📚 BOOK CRUD OPERATIONS
# ==========================================================
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from mongoengine.errors import DoesNotExist, ValidationError
from datetime import datetime





@require_role('admin')
@csrf_exempt
def create_book(request):
    """Create a new Book record."""
    if request.method != "POST":
        return JsonResponse({"error": "Invalid HTTP method"}, status=405)

    data = parse_json(request)
    if not data:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    try:
        book = Book(
            title=data.get("title"),
            author=data.get("author"),
            category=data.get("category"),
            edition=data.get("edition", "1st"),
            publisher=data.get("publisher"),
            published_year=data.get("published_year"),
            price=data.get("price"),
            location=data.get("location"),
            isbn=data.get("isbn"),
            language=data.get("language", "English"),
            no_of_pages=data.get("no_of_pages"),
            cover_image_url=data.get("cover_image_url"),
            ebook_url=data.get("ebook_url"),
            total_copies=data.get("total_copies", 0),
            available_copies=data.get("available_copies", 0),
            waitlist=data.get("waitlist", []),
        )
        book.save()
        return JsonResponse({
            "message": "Book created successfully",
            "id": str(book.id)
        }, status=201)

    except ValidationError as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def list_books(request):
    """List all books with filtering, search, and pagination."""
    if request.method != "GET":
        return JsonResponse({"error": "Invalid HTTP method"}, status=405)

    query = {}

    # -----------------------------
    # Filtering
    # -----------------------------
    if "author" in request.GET:
        query["author__icontains"] = request.GET["author"]
    if "title" in request.GET:
        query["title__icontains"] = request.GET["title"]
    if "category" in request.GET:
        query["category__icontains"] = request.GET["category"]
    if "price_min" in request.GET:
        query["price__gte"] = int(request.GET["price_min"])
    if "price_max" in request.GET:
        query["price__lte"] = int(request.GET["price_max"])
    if "published_year" in request.GET:
        query["published_year"] = int(request.GET["published_year"])

    # -----------------------------
    # Full-text Search
    # -----------------------------
    if "search" in request.GET:
        search_text = request.GET["search"]
        query["$or"] = [
            {"title__icontains": search_text},
            {"author__icontains": search_text},
            {"category__icontains": search_text},
        ]

    # -----------------------------
    # Pagination
    # -----------------------------
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    start = (page - 1) * page_size
    end = start + page_size

    books = Book.objects(**query).order_by("-created_at")[start:end]

    result = []
    for b in books:
        result.append({
            "id": str(b.id),
            "title": b.title,
            "author": b.author,
            "category": b.category,
            "edition": b.edition,
            "publisher": b.publisher,
            "published_year": b.published_year,
            "price": b.price,
            "location": b.location,
            "isbn": b.isbn,
            "language": b.language,
            "no_of_pages": b.no_of_pages,
            "cover_image_url": b.cover_image_url,
            "ebook_url": b.ebook_url,
            "total_copies": b.total_copies,
            "available_copies": b.available_copies,
            "waitlist": b.waitlist,
            "created_at": b.created_at.isoformat(),
        })

    return JsonResponse(result, safe=False)


@csrf_exempt
def get_book(request, book_id):
    """Retrieve a single book by its ID."""
    if request.method != "GET":
        return JsonResponse({"error": "Invalid HTTP method"}, status=405)

    try:
        book = Book.objects.get(id=book_id)
        return JsonResponse({
            "id": str(book.id),
            "title": book.title,
            "author": book.author,
            "category": book.category,
            "edition": book.edition,
            "publisher": book.publisher,
            "published_year": book.published_year,
            "price": book.price,
            "location": book.location,
            "isbn": book.isbn,
            "language": book.language,
            "no_of_pages": book.no_of_pages,
            "cover_image_url": book.cover_image_url,
            "ebook_url": book.ebook_url,
            "total_copies": book.total_copies,
            "available_copies": book.available_copies,
            "waitlist": book.waitlist,
            "created_at": book.created_at.isoformat(),
        })

    except DoesNotExist:
        return JsonResponse({"error": "Book not found"}, status=404)


@require_role('admin')
@csrf_exempt
def update_book(request, book_id):
    """Update book details safely."""
    if request.method != "PUT":
        return JsonResponse({"error": "Invalid HTTP method"}, status=405)

    data = parse_json(request)
    if not data:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    try:
        book = Book.objects.get(id=book_id)

        updatable_fields = [
            "title", "author", "category", "edition", "publisher", "published_year",
            "price", "location", "isbn", "language", "no_of_pages",
            "cover_image_url", "ebook_url", "total_copies", "available_copies", "waitlist"
        ]

        updates = {field: data[field] for field in updatable_fields if field in data}
        if updates:
            book.update(**updates)

        return JsonResponse({"message": "Book updated successfully"})

    except DoesNotExist:
        return JsonResponse({"error": "Book not found"}, status=404)
    except ValidationError as e:
        return JsonResponse({"error": str(e)}, status=400)


@require_role('admin')
@csrf_exempt
def delete_book(request, book_id):
    """Delete a book by ID."""
    if request.method != "DELETE":
        return JsonResponse({"error": "Invalid HTTP method"}, status=405)

    try:
        book = Book.objects.get(id=book_id)
        book.delete()
        return JsonResponse({"message": "Book deleted successfully"})
    except DoesNotExist:
        return JsonResponse({"error": "Book not found"}, status=404)

# ==========================================================
# 📖 BOOK COPY CRUD OPERATIONS
# ==========================================================

@require_role('admin')
@csrf_exempt
def create_book_copy(request):
    """Create a new Book Copy"""
    if request.method == "POST":
        data = parse_json(request)
        if not data:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        try:
            book = Book.objects.get(id=data.get("book_id"))
        except DoesNotExist:
            return JsonResponse({"error": "Book not found"}, status=404)

        try:
            copy = BookCopy(
                book=book,
                barcode=data.get("barcode"),
                is_available=data.get("is_available", True),
                is_damaged=data.get("is_damaged", False),
                condition=data.get("condition", "Good"),
                remarks=data.get("remarks"),
                last_borrowed_at=data.get("last_borrowed_at"),
                
                vendor=data.get("vendor"),
                added_at=datetime.utcnow(),
            )
            copy.save()
            return JsonResponse({"message": "Book copy created successfully", "id": str(copy.id)})
        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid HTTP method"}, status=405)



@csrf_exempt
def list_book_copies(request):
    """List BookCopies with advanced filtering, search, and pagination"""
    if request.method != "GET":
        return JsonResponse({"error": "Invalid HTTP method"}, status=405)

    query = {}

    # ----------------------
    # Filters
    # ----------------------
    if "vendor" in request.GET:
        query["vendor__icontains"] = request.GET["vendor"]
    if "is_available" in request.GET:
        query["is_available"] = request.GET["is_available"].lower() == "true"
    if "is_damaged" in request.GET:
        query["is_damaged"] = request.GET["is_damaged"].lower() == "true"
    if "condition" in request.GET:
        query["condition__icontains"] = request.GET["condition"]

    # Date filters
   

    # ----------------------
    # Full-text search (Book related)
    # ----------------------
    if "search" in request.GET:
        search_text = request.GET["search"]
        query["$or"] = [
            {"barcode__icontains": search_text},
            {"book.title__icontains": search_text},
            {"book.author__icontains": search_text},
            {"book.category__icontains": search_text},
        ]

    # ----------------------
    # Pagination
    # ----------------------
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))
    start = (page - 1) * page_size
    end = start + page_size

    # ----------------------
    # Fetch BookCopies
    # ----------------------
    copies = BookCopy.objects(**query)[start:end]

    result = [
        {
            "id": str(c.id),
            "book_id": str(c.book.id),
            "book_title": c.book.title,
            "barcode": c.barcode,
            "is_available": c.is_available,
            "is_damaged": c.is_damaged,
            "condition": c.condition,
            "remarks": c.remarks,
            "last_borrowed_at": c.last_borrowed_at.isoformat() if c.last_borrowed_at else None,
            
            "vendor": c.vendor,
            "added_at": c.added_at.isoformat(),
        }
        for c in copies
    ]

    return JsonResponse(result, safe=False)

@csrf_exempt
def get_book_copy(request, copy_id):
    """Get a single Book Copy"""
    if request.method == "GET":
        try:
            c = BookCopy.objects.get(id=copy_id)
            return JsonResponse({
                "id": str(c.id),
                "book_id": str(c.book.id),
                "book_title": c.book.title,
                "barcode": c.barcode,
                "is_available": c.is_available,
                "is_damaged": c.is_damaged,
                "condition": c.condition,
                "remarks": c.remarks,
                "last_borrowed_at": c.last_borrowed_at.isoformat() if c.last_borrowed_at else None,
                
                "vendor": c.vendor,
                "added_at": c.added_at.isoformat(),
            })
        except DoesNotExist:
            return JsonResponse({"error": "Book copy not found"}, status=404)

    return JsonResponse({"error": "Invalid HTTP method"}, status=405)

@require_role('librarian')
@csrf_exempt
def update_book_copy(request, copy_id):
    """Update a Book Copy"""
    if request.method == "PUT":
        data = parse_json(request)
        if not data:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        try:
            copy = BookCopy.objects.get(id=copy_id)
        except DoesNotExist:
            return JsonResponse({"error": "Book copy not found"}, status=404)

        # Update book if provided
        if "book_id" in data:
            try:
                copy.book = Book.objects.get(id=data["book_id"])
            except DoesNotExist:
                return JsonResponse({"error": "Book not found"}, status=404)

        # Update all other fields dynamically
        for field, value in data.items():
            if hasattr(copy, field):
                setattr(copy, field, value)

        try:
            copy.save()
            return JsonResponse({"message": "Book copy updated successfully"})
        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid HTTP method"}, status=405)

@require_role('librarian')
@csrf_exempt
def delete_book_copy(request, copy_id):
    """Delete a Book Copy"""
    if request.method == "DELETE":
        try:
            copy = BookCopy.objects.get(id=copy_id)
            copy.delete()
            return JsonResponse({"message": "Book copy deleted successfully"})
        except DoesNotExist:
            return JsonResponse({"error": "Book copy not found"}, status=404)

    return JsonResponse({"error": "Invalid HTTP method"}, status=405)
