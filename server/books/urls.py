# books/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Book endpoints
    path('books/', views.homepage_books, name='home_page_books'),
    path('books/search/', views.list_books, name='list_books'),
    path('books/create/', views.create_book, name='create_book'),
    path('books/<str:book_id>/', views.get_book, name='get_book'),
   
    path('books/<str:book_id>/update/', views.update_book, name='update_book'),
    path('books/<str:book_id>/delete/', views.delete_book, name='delete_book'),

    # BookCopy endpoints
    path('copies/create/', views.create_book_copy, name='create_book_copy'),
    path('copies/', views.list_book_copies, name='list_book_copies'),
  
    path('copies/<str:copy_id>/', views.get_book_copy, name='get_book_copy'),
    
    path('copies/<str:copy_id>/update/', views.update_book_copy, name='update_book_copy'),
    path('copies/<str:copy_id>/delete/', views.delete_book_copy, name='delete_book_copy'),
 
    
]
