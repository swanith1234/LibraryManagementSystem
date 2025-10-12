# backend/utils/decorators.py
from functools import wraps
from django.http import JsonResponse
from backend.utils.auth_utils import has_role

def role_required(allowed_roles):
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            user = getattr(request, "user", None)
            if not user or not has_role(user, allowed_roles):
                return JsonResponse({"error": "Permission denied"}, status=403)
            return func(request, *args, **kwargs)
        return wrapper
    return decorator
