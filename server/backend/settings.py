"""
Django settings for backend project using MongoEngine.

This setup works with MongoDB Atlas and Django 4.x.
No Djongo required.
"""

from pathlib import Path
from mongoengine import connect
import os

# ------------------------------
# BASE DIRECTORY
# ------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# ------------------------------
# SECURITY SETTINGS
# ------------------------------
SECRET_KEY = 'Swanith@123'  # replace with a strong secret in production
DEBUG = True  # Turn off in production
ALLOWED_HOSTS = ['*']  # Add your production host/domain here

# ------------------------------
# APPLICATION DEFINITION
# ------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'books',
    'users',
    'borrow',
    'drf_yasg',  # For Swagger documentation
    # 'rest_framework',  # Uncomment when using DRF for APIs
]
# backend/settings.py



MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
     'backend.middleware.auth_middleware.JWTAuthenticationMiddleware'
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],  # Add template dirs if needed
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# ------------------------------
# MONGODB CONNECTION (MONGENGINE)
# ------------------------------
# Connect to MongoDB Atlas
from mongoengine import connect

connect(
    db="librarymanagementsystem",
    host="mongodb+srv://swanithpidugu_db_user:Swanith%40123@cluster0.dauwjgw.mongodb.net/librarymanagementsystem?retryWrites=true&w=majority&tls=true"
)


# ------------------------------
# PASSWORD VALIDATION
# ------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# ------------------------------
# INTERNATIONALIZATION
# ------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ------------------------------
# STATIC FILES
# ------------------------------
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')  # For production collectstatic

# ------------------------------
# DEFAULT PRIMARY KEY FIELD
# ------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "swanithpidugu@gmail.com"
EMAIL_HOST_PASSWORD = "jfyw oiiq kguz pfdc"  # app-specific password
DEFAULT_FROM_EMAIL = "Library System swanithpidugu@gmail.com"
