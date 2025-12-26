from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from app.core.conf import APP_NAME, APP_VERSION, DEBUG, API_V1_PREFIX
from app.api.v1 import api_router
from app.common.exception_handler import (
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler
)
from app.common.errors import UserErrors, ClientErrors, DatabaseErrors

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    debug=DEBUG
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
    return {"status": "healthy"}

