from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="📚 Library Management API",
        default_version='v1.0',
        description="""
        **A modern SaaS Library Management System**  
        - Role-based access (Admin, Librarian, Member)  
        - Borrow & Return workflow  
        - Optional microservices: Payment & Delivery  
        """,
        contact=openapi.Contact(email="support@librarysaas.io"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Include app routes
    path('api/', include('books.urls')),
    path('api/users/', include('users.urls')),
    path('api/borrow/', include('borrow.urls')),
    # path('api/tenants/', include('tenants.urls')),

    # Swagger & Redoc
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
