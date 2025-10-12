from django.http import JsonResponse
from users.models import User
from backend.utils.auth_utils import decode_token

class JWTAuthenticationMiddleware:
    """
    Middleware to authenticate the user using JWT access token.
    Sets request.user except for exempt paths.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        # Add all routes that should NOT require JWT here
        self.exempt_paths = [
            '/swagger/',
            '/swagger.json',
            '/swagger.yaml',
            '/redoc/',
            '/admin/',
            "/api/users/login/",
            "/api/users/register/",
            "/api/users/refresh-token/",
            "/api/users/forgot-password/",
            "/api/users/reset-password/",
            "/admin/",  # optional
            "/healthcheck/",
        ]

    def __call__(self, request):
        print(request.path)
        # ✅ Skip authentication for exempt paths
        if any(request.path.startswith(path) for path in self.exempt_paths):
            return self.get_response(request)

        token = request.COOKIES.get("access_token") or request.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            token = token[7:]

        # decode_token should return a User object or None
        request.user = decode_token(token)

        if request.user is None:
            return JsonResponse({"error": "Invalid or expired token"}, status=401)

        return self.get_response(request)
