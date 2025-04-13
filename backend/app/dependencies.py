import os
from supabase import create_client, Client
from typing import Generator

def get_supabase() -> Client:
    """Get Supabase client instance"""
    url: str = os.getenv("SUPABASE_URL", "")
    key: str = os.getenv("SUPABASE_KEY", "")
    return create_client(url, key) 