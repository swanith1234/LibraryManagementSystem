# users/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Public endpoints
    path('register/', views.register_user, name='register_user'),
    path('login/', views.login_user, name='login_user'),
    path('refresh-token/', views.refresh_token_view, name='refresh_token'),

    # Authenticated endpoints
    path('profile/', views.get_profile, name='get_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),

    # Admin-only endpoints
    path('search/', views.search_users, name='search_users'),
    path('all-users/', views.get_all_users, name='get_all_users'),

    # Member-only endpoints
    
    path('update-role/', views.update_user_role, name='update_user_role'),  # Admin can update user roles
    path('delete-user/', views.delete_user, name='delete_user'),  # Admin can delete users
   # Send password reset email
path("forgot-password/", views.forgot_password, name="forgot_password"),

   # Reset password using the token
path("reset-password/", views.reset_password, name="reset_password"),
# Admin updates user role
path("update-role/<str:user_id>/", views.update_user_role, name="update_user_role"),
path('profile/<str:user_id>', views.get_user_profile, name='get_user_profile'),

]
