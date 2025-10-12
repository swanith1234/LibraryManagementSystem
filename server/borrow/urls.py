from django.urls import path
from . import views

urlpatterns = [
    # --------------------------
    # 📗 Member Endpoints
    # --------------------------
    path('create/', views.borrow_book, name='borrow_book'),                      # POST → borrow a book
    path('return/', views.return_book, name='return_book'),                      # PUT → return a book (barcode + user_email/username)

    # --------------------------
    # 📘 Librarian Endpoints
    # --------------------------
    path('records/', views.list_borrows, name='list_borrows'),                  # GET → list/filter borrow records

    # --------------------------
    # (Optional Future Endpoints)
    # --------------------------
    # path('pending/', views.pending_returns, name='pending_returns'),
    # path('admin/all/', views.admin_list_all_borrows, name='admin_list_all_borrows'),
    path("member-summary/", views.member_borrow_summary),
    path("member-summary/<str:user_identifier>/", views.librarian_view_member_summary),
]
