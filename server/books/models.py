from mongoengine import (
    Document, StringField, IntField, ReferenceField,
    BooleanField, DateTimeField, ListField
)
from datetime import datetime


# ---------------------------------------------------------------------------
# 📘 Book Model
# ---------------------------------------------------------------------------
class Book(Document):
    """
    Represents the main book entity (title, author, edition, price, etc.).
    """
    # Basic information
    title = StringField(required=True, max_length=200)
    author = StringField(required=True, max_length=100)
    category = StringField(max_length=50)
    edition = StringField(max_length=50, default="1st")
    publisher = StringField(max_length=100)
    published_year = IntField()

    # Library-related metadata
    price = IntField()                          # Cost of the book for the library
    location = StringField(max_length=100)      # Shelf/rack location (e.g., "Rack A3 - Row 2")

    # Optional additional info
    isbn = StringField(max_length=20)
    language = StringField(max_length=30, default="English")
    no_of_pages = IntField()

    # Media / digital resources
    cover_image_url = StringField()
    ebook_url = StringField()

    # Availability and copies
    total_copies = IntField(default=0)
    available_copies = IntField(default=0)

    # Waitlist (list of user IDs waiting for the book)
    waitlist = ListField(StringField())
    related_books=ListField(ReferenceField('self'))
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    meta = {
        "indexes": [
            # Full-text search on relevant fields
            {"fields": ["$title", "$author", "$category", "$publisher"], "default_language": "english"},
            # Optional: single-field indexes for filtering
            "category",
            "author",
            "published_year",
        ]
    }

    def __str__(self):
        return f"{self.title} ({self.edition}) by {self.author}"

    # Update counters safely
    def increment_copies(self, count=1):
        self.total_copies += count
        self.available_copies += count
        self.save()

    def decrement_available(self, count=1):
        if self.available_copies >= count:
            self.available_copies -= count
            self.save()


# ---------------------------------------------------------------------------
# 📗 BookCopy Model
# ---------------------------------------------------------------------------
class BookCopy(Document):
    """
    Represents a physical copy of a particular book.
    Each copy has a unique barcode and can have its own condition.
    """
    book = ReferenceField(Book, required=True, reverse_delete_rule=2)  # CASCADE delete
    barcode = StringField(required=True, unique=True)
    is_available = BooleanField(default=True)
    is_damaged = BooleanField(default=False)
    condition = StringField(default="Good")  # "New", "Good", "Worn"
    remarks = StringField()

    added_at = DateTimeField(default=datetime.utcnow)
    last_borrowed_at = DateTimeField()
    
    vendor = StringField(max_length=100)
    meta = {
    "indexes": [
        {"fields": ["$barcode", "$vendor"], "default_language": "english"},
        "is_available",
        "is_damaged",
        "condition",
        "vendor",
    ]
}

    def __str__(self):
        return f"{self.book.title} - Copy: {self.barcode}"

    # -----------------------------------------------------------
    # 🟢 Auto-update available_copies on save
    # -----------------------------------------------------------
    def save(self, *args, **kwargs):
        is_new = self.pk is None  # check if this is a new document
        old_copy = None

        # If updating existing copy, check if availability changed
        if not is_new:
            old_copy = BookCopy.objects(id=self.id).first()

        result = super().save(*args, **kwargs)

        # If it's a new copy, increment both total and available count
        if is_new:
            self.book.total_copies += 1
            if self.is_available:
                self.book.available_copies += 1
            self.book.save()

        # If updating existing record and availability changed
        elif old_copy and old_copy.is_available != self.is_available:
            if self.is_available:
                self.book.available_copies += 1
            else:
                self.book.available_copies -= 1
            self.book.save()

        return result

    # -----------------------------------------------------------
    # 🔴 Auto-update on delete
    # -----------------------------------------------------------
    def delete(self, *args, **kwargs):
        # Decrease counters before deleting
        if self.is_available:
            self.book.available_copies = max(0, self.book.available_copies - 1)

        self.book.total_copies = max(0, self.book.total_copies - 1)
        self.book.save()

        return super().delete(*args, **kwargs)
