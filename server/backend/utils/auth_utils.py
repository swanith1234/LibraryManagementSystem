# backend/utils/auth_utils.py
import jwt
from datetime import datetime, timedelta
from users.models import User
from bson import ObjectId
from mongoengine.errors import ValidationError
SECRET_KEY = "YOUR_SECRET_KEY"  # use env variable in production
ALGORITHM = "HS256"

# ----------------------
# Token Generation
# ----------------------
def generate_access_token(user_id, exp_hours=1):
    payload = {
        "user_id": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=exp_hours),
        "type": "access"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def generate_refresh_token(user_id, exp_days=7):
    payload = {
        "user_id": str(user_id),
        "exp": datetime.utcnow() + timedelta(days=exp_days),
        "type": "refresh"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# ----------------------
# Token Decoding
# ----------------------
def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            return None

        # Convert user_id to ObjectId for MongoEngine
        user = User.objects.get(id=ObjectId(user_id))
        return user
    except (User.DoesNotExist, ValidationError, jwt.ExpiredSignatureError, jwt.DecodeError):
        return None

# ----------------------
# Role Check
# ----------------------
def has_role(user, roles):
    """
    roles: string or list of strings e.g. 'admin', 'librarian', 'member'
    """
    if isinstance(roles, str):
        roles = [roles]
    return user.role in roles
