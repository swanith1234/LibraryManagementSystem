# library/models.py
from mongoengine import Document, StringField, EmailField, BooleanField, DateTimeField, IntField, ListField, ReferenceField
from datetime import datetime

# ---------------------------------------------------------------------------
# 📌 User Model
# ---------------------------------------------------------------------------
class User(Document):
    """
    Represents a user in the library system.
    Roles: member, librarian, admin
    """
    
    # Basic Info
    username = StringField(required=True, max_length=50, unique=True)
    email = EmailField(required=True, unique=True)
    full_name = StringField(max_length=100)
    phone = StringField(max_length=20)
    
    # Authentication
    password_hash = StringField(required=True)  # store hashed passwords only
    is_active = BooleanField(default=True)
    
    # Roles / Permissions
    role = StringField(
        choices=['member', 'librarian', 'admin'], 
        default='member'
    )
    
    # Metadata
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    # Optional fields
    address = StringField(max_length=200)
    profile_picture_url = StringField()
    
    def __str__(self):
        return f"{self.username} ({self.role})"

