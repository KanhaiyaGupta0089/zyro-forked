from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.conf import DATABASE_URL, DEBUG 

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=DEBUG,            # Enable SQL logging in debug mode
    future=True,
    pool_size=5,           # max persistent connections (reduced to prevent connection exhaustion)
    max_overflow=5,        # allow temporary burst (reduced to prevent connection exhaustion)
    pool_timeout=30,       # fail fast instead of hanging
    pool_recycle=1800,     # recycle connections after 30 minutes
    pool_pre_ping=True,    # verify connections before using (prevents stale connections)
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
  
)

# Base class for models
Base = declarative_base()

# Dependency to get database session
async def get_db():
    """
    Dependency to get database session.
    Ensures session is properly closed and connections are returned to pool.
    Handles connection errors gracefully.
    """
    try:
        async with AsyncSessionLocal() as session:
            try:
                yield session
            except Exception:
                # Rollback on any exception during session use
                await session.rollback()
                raise
    except Exception as e:
        # Re-raise connection errors (like TooManyConnectionsError)
        # These happen during session creation, before session exists
        # The error will be caught by the exception handler in dependencies.py
        raise