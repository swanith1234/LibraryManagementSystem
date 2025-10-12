from functools import wraps
from django.http import JsonResponse

def require_role(*roles):
    """Decorator to enforce user roles on a view"""
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped(request, *args, **kwargs):
            if not getattr(request, "user", None):
                return JsonResponse({"error": "Authentication required"}, status=401)
            if request.user.role not in roles:
                return JsonResponse({"error": "Permission denied"}, status=403)
            return view_func(request, *args, **kwargs)
        return _wrapped
    return decorator
