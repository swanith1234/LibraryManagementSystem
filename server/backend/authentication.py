# backend/authentication.py
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from users.models import User
from backend.utils.auth_utils import decode_token

class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get("access_token") or request.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            token = token[7:]
            print(token)
  
        user = decode_token(token)
        print(user)
        if not user:
            return None

        return (user, None)  # DRF sets request.user = user
