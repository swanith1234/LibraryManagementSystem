# backend/permissions/role_permissions.py
from rest_framework.permissions import BasePermission

# -----------------------------
# Admin only
# -----------------------------
class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'admin'


# -----------------------------
# Librarian only
# -----------------------------
class IsLibrarianUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'librarian'


# -----------------------------
# Member only
# -----------------------------
class IsMemberUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'member'


# -----------------------------
# Admin or Librarian
# -----------------------------
class IsAdminOrLibrarian(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role in ['admin', 'librarian']


# -----------------------------
# Admin or Member
# -----------------------------
class IsAdminOrMember(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role in ['admin', 'member']
