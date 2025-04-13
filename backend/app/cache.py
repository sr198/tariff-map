import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, List
import threading
import time

CACHE_DIR = Path(__file__).parent.parent / 'cache'
CACHE_DIR.mkdir(exist_ok=True)

def get_cache_path(key: str) -> Path:
    """Get the path for a cache file based on the key"""
    return CACHE_DIR / f"{key}.json"

def get(key: str, max_age_hours: int = 24):
    """Get a value from cache if it exists and is not too old"""
    cache_path = get_cache_path(key)
    
    if not cache_path.exists():
        return None
        
    # Check if cache is too old
    file_age = datetime.now() - datetime.fromtimestamp(cache_path.stat().st_mtime)
    if file_age > timedelta(hours=max_age_hours):
        cache_path.unlink()  # Delete old cache
        return None
        
    try:
        with open(cache_path, 'r') as f:
            return json.load(f)
    except:
        return None

def set(key: str, value: any):
    """Store a value in cache"""
    cache_path = get_cache_path(key)
    try:
        with open(cache_path, 'w') as f:
            json.dump(value, f)
    except:
        pass  # Silently fail if cache write fails

def clear():
    """Clear all cache files"""
    for file in CACHE_DIR.glob('*.json'):
        try:
            file.unlink()
        except:
            pass

class Cache:
    """
    A simple in-memory cache with time-based expiration.
    """
    def __init__(self, default_ttl_seconds: int = 86400):  # Default TTL: 24 hours
        self._cache: Dict[str, Tuple[Any, datetime]] = {}
        self._default_ttl = timedelta(seconds=default_ttl_seconds)
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from the cache if it exists and hasn't expired.
        """
        with self._lock:
            if key not in self._cache:
                self._misses += 1
                return None
            
            value, expiration = self._cache[key]
            if datetime.now() > expiration:
                del self._cache[key]
                self._misses += 1
                return None
            
            self._hits += 1
            return value
    
    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """
        Set a value in the cache with an optional TTL in seconds.
        """
        ttl = timedelta(seconds=ttl_seconds) if ttl_seconds is not None else self._default_ttl
        expiration = datetime.now() + ttl
        
        with self._lock:
            self._cache[key] = (value, expiration)
    
    def delete(self, key: str) -> None:
        """
        Delete a key from the cache.
        """
        with self._lock:
            if key in self._cache:
                del self._cache[key]
    
    def clear(self) -> None:
        """
        Clear all items from the cache.
        """
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
    
    def cleanup_expired(self) -> None:
        """
        Remove all expired items from the cache.
        """
        now = datetime.now()
        with self._lock:
            expired_keys = [k for k, (_, exp) in self._cache.items() if now > exp]
            for key in expired_keys:
                del self._cache[key]
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        """
        with self._lock:
            total_requests = self._hits + self._misses
            hit_rate = self._hits / total_requests if total_requests > 0 else 0
            
            # Count expired items
            now = datetime.now()
            expired_count = sum(1 for _, (_, exp) in self._cache.items() if now > exp)
            
            return {
                "size": len(self._cache),
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": hit_rate,
                "expired_count": expired_count
            }
    
    def get_keys(self) -> List[str]:
        """
        Get all cache keys.
        """
        with self._lock:
            return list(self._cache.keys())

# Create a global cache instance
cache = Cache(default_ttl_seconds=86400 * 7)  # Default TTL: 7 days 