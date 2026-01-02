from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.conf import APP_NAME, APP_VERSION, DEBUG, API_V1_PREFIX
from app.api.v1 import api_router
from app.common.exception_handler import (
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler
)
from app.common.errors import UserErrors, ClientErrors, DatabaseErrors
from app.db.connection import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI app.
    Handles startup and shutdown events to properly manage database connections.
    """
    # Startup
    yield
    # Shutdown - properly dispose of database engine connections
    await engine.dispose()

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    debug=DEBUG,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default port
        "http://localhost:3000",  # React default port
        "http://localhost:5174",  # Alternative Vite port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5174",
        "https://zyro-g2c4.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Register exception handlers
# Register specific exception types first (more specific to less specific)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(DatabaseErrors, global_exception_handler)
app.add_exception_handler(UserErrors, global_exception_handler)
app.add_exception_handler(ClientErrors, global_exception_handler)
# Register generic Exception handler last as fallback
app.add_exception_handler(Exception, global_exception_handler)

# Note: Database tables should be created using Alembic migrations
# Run: alembic upgrade head
# Base.metadata.create_all() doesn't work with AsyncEngine

# Include API router
app.include_router(api_router, prefix=API_V1_PREFIX)

@app.get("/")
async def root():
    return {"message": "Welcome to Zyro API"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        # Check database connection pool status
        pool = engine.pool
        pool_status = {
            "size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "invalid": pool.invalid(),
        }
        return {
            "status": "healthy",
            "database_pool": pool_status
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

