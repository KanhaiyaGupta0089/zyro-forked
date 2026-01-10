from redis import Redis
import redis.asyncio as redis
from app.core.conf import REDIS_HOST, REDIS_PORT, REDIS_PASSWORD


# Sync redis client for regular operations
redis_client = Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    decode_responses=True
)

# Async redis client for async operations (Pub/Sub)
async_redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    decode_responses=True
)
