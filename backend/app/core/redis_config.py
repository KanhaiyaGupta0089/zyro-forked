from redis import Redis
import redis.asyncio as redis
from app.core.conf import REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_USERNAME, REDIS_USE_SSL

# Sync redis client for regular operations
redis_client = Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    username=REDIS_USERNAME,  # Add this
    password=REDIS_PASSWORD,
    ssl=REDIS_USE_SSL,  # Add this
    ssl_cert_reqs=None,  # Add this for self-signed certs
    decode_responses=True
)

# Async redis client for async operations (Pub/Sub)
async_redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    username=REDIS_USERNAME,  # Add this
    password=REDIS_PASSWORD,
    ssl=REDIS_USE_SSL,  # Add this
    ssl_cert_reqs=None,  # Add this for self-signed certs
    decode_responses=True
)