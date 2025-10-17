# backend/utils/redis_client.py
import os
import redis
import json

REDIS_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

class RedisClient:
    def __init__(self, url=REDIS_URL):
        self.r = redis.from_url(url)

    # Store a dictionary as JSON string
    def set_progress(self, task_id, payload):
        self.r.set(f"upload:{task_id}", json.dumps(payload))

    # Retrieve JSON string and convert to dict
    def get_progress(self, task_id):
        raw = self.r.get(f"upload:{task_id}")
        return json.loads(raw) if raw else None

    def clear_progress(self, task_id):
        self.r.delete(f"upload:{task_id}")

    # Optional: Redis hash support
    def hset(self, key, mapping):
        self.r.hset(key, mapping=mapping)

    def hgetall(self, key):
        return self.r.hgetall(key)

# Global instance
redis_client = RedisClient()
