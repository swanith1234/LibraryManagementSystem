# library/models.py
from mongoengine import Document, StringField, EmailField, BooleanField, DateTimeField, IntField, ListField, ReferenceField
from datetime import datetime

# ---------------------------------------------------------------------------
# 📌 User Model
# ---------------------------------------------------------------------------
# library/models.py
class User(Document):
    """
    Represents a user in the library system.
    Roles: member, librarian, admin
    """
    
    username = StringField(required=True, max_length=50, unique=True)
    email = EmailField(required=True, unique=True)
    full_name = StringField(max_length=100)
    phone = StringField(max_length=20)
    
    password_hash = StringField(required=True)
    is_active = BooleanField(default=True)
    
    role = StringField(
        choices=['member', 'librarian', 'admin'], 
        default='member'
    )
    
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    address = StringField(max_length=200)
    profile_picture_url = StringField()
    
    meta = {
        'indexes': [
            'username',       # index for searching by username
            'email',          # index for searching by email
            'role',           # index for filtering by role
            {'fields': ['$username', '$email'], 'default_language': 'english'}  # text index
        ]
    }
    
    def __str__(self):
        return f"{self.username} ({self.role})"
