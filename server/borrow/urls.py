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
    path("calculate-fine/", views.get_fine,name="get_fine"),  # POST → calculate fine for a borrow record
    path("search/", views.search_borrows, name="search_borrows"),  # GET → search borrow records by user or book
     path('/borrow-history/', views.get_user_borrow_history, name='get_user_borrow_history'),
]
