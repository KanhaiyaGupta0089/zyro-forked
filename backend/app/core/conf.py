import os
from dotenv import load_dotenv
from pathlib import Path

# Get the directory where this file is located
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env.local
env_path = BASE_DIR / ".env.local"
load_dotenv(env_path)

# App Settings
APP_NAME = os.getenv("APP_NAME", "Zyro API")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Server Settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# API Settings
API_V1_PREFIX = os.getenv("API_V1_PREFIX", "/api/v1")

DB_NAME = os.getenv("DB_NAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_USER = os.getenv("DB_USER")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# Database Settings
DATABASE_URL = os.getenv("DATABASE_URL", f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# JWT Settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Handle JWT token expiration - convert to int, with defaults
_jwt_access_expire = os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(_jwt_access_expire) if _jwt_access_expire.isdigit() else 30

_jwt_refresh_expire = os.getenv("JWT_REFRESH_TOKEN_EXPIRE_MINUTES", "10080")  # Default: 7 days
# Handle if it's a calculation like "60 * 24 * 7"
if _jwt_refresh_expire.isdigit():
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES = int(_jwt_refresh_expire)
else:
    try:
        # Try to evaluate if it's a simple expression
        JWT_REFRESH_TOKEN_EXPIRE_MINUTES = eval(_jwt_refresh_expire) if '*' in _jwt_refresh_expire or '+' in _jwt_refresh_expire else 10080
    except:
        JWT_REFRESH_TOKEN_EXPIRE_MINUTES = 10080  # Default: 7 days


# Email Settings
    
EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = os.getenv("EMAIL_PORT")
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND")