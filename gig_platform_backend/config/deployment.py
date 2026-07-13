import os
from .settings import *
from .settings import BASE_DIR

ALLOWED_HOSTS = ["api.gig-work.me","*"]
CSRF_TRUSTED_ORIGINS = ["https://gig-work.me","www.gig-work.me","http://192.168.56.1:5173","http://192.168.101:5173"]
DEBUG = False
SECRET_KEY = "k$$_uqx9+1diy)%ar*g13ph90*@!dr33_*g8urvhp1sgy21de"
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = True
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

CORS_ALLOWED_ORIGINS = [
    'https://gigworkerproject.azurewebsites.net',
    'https://gig-work.me',
    'https://www.gig-work.me',
    'https://www.api.gig-work.me',
    'https:/api.gig-work.me',
    'http://192.168.56.1:5173/',
    'http://192.168.101:5173/',
]

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME"),
        "USER": os.environ.get("DB_USER"),
        "PASSWORD": os.environ.get("DB_PASSWORD"),
        "HOST": os.environ.get("DB_HOST"),
        "PORT": os.environ.get("DB_PORT","5432"),
    }
}

STATIC_ROOT = BASE_DIR / "staticfiles"
# production.py or deployment.py

