from mongoengine import Document, ReferenceField, DateTimeField, BooleanField, FloatField, StringField
from datetime import datetime
from books.models import Book, BookCopy
from users.models import User

class BorrowRecord(Document):
    user = ReferenceField(User, required=True)
    book = ReferenceField(Book, required=True)
    copy = ReferenceField(BookCopy, required=True)
    borrow_date = DateTimeField(default=datetime.utcnow)
    due_date = DateTimeField(required=True)
    return_date = DateTimeField(null=True)
    returned = BooleanField(default=False)  # ✅ Must exist!
    fine = FloatField(default=0.0)
    fine_payment_status = StringField(default="Not Applicable")
    book_condition_on_return = StringField(default="Good")
    remarks_on_return = StringField(default="")
