from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.conf import DATABASE_URL, DEBUG

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=DEBUG,
    future=True,
    pool_size=5,          # max persistent connections
    max_overflow=5,       # allow temporary burst
    pool_timeout=30,      # fail fast instead of hanging
    pool_recycle=1800, 
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
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()