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



# # backend/utils/auth_utils.py
# import jwt
# from datetime import datetime, timedelta
# from users.models import User
# from bson import ObjectId
# from mongoengine.errors import ValidationError
# SECRET_KEY = "YOUR_SECRET_KEY"  # use env variable in production
# ALGORITHM = "HS256"

# # ----------------------
# # Token Generation
# # ----------------------
# def generate_access_token(user_id, user_type="user", exp_hours=1):
#     """
#     user_type: "user" (library user) or "tenant" (tenant admin)
#     """
#     payload = {
#         "user_id": str(user_id),
#         "user_type": user_type,
#         "exp": datetime.utcnow() + timedelta(hours=exp_hours),
#         "type": "access"
#     }
#     return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# def generate_refresh_token(user_id, user_type="user", exp_days=7):
#     payload = {
#         "user_id": str(user_id),
#         "user_type": user_type,
#         "exp": datetime.utcnow() + timedelta(days=exp_days),
#         "type": "refresh"
#     }
#     return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# # ----------------------
# # Token Decoding
# # ----------------------

# def decode_token(token):
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         user_id = payload.get("user_id")
#         user_type = payload.get("user_type", "user")  # default to user
#         if not user_id:
#             return None

#         if user_type == "tenant":
#             return Tenant.objects.get(id=ObjectId(user_id))
#         else:
#             return User.objects.get(id=ObjectId(user_id))

#     except (User.DoesNotExist, Tenant.DoesNotExist, ValidationError, jwt.ExpiredSignatureError, jwt.DecodeError):
#         return None

# # ----------------------
# # Role Check
# # ----------------------
# def has_role(user, roles):
#     """
#     roles: string or list of strings e.g. 'admin', 'librarian', 'member'
#     """
#     if isinstance(roles, str):
#         roles = [roles]
#     return user.role in roles
