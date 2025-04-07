from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import threading
import time

# Import routers
from .routers import trade, tariffs
from .cache import cache

# Initialize FastAPI app
app = FastAPI(
    title="Tariff Map API",
    description="API for accessing trade and tariff data",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(trade.router)
app.include_router(tariffs.router)

@app.get("/")
async def root():
    return {"message": "Tariff Map API is running"}

# Background task for cache cleanup
def run_cache_cleanup():
    while True:
        try:
            cache.cleanup_expired()
            # Sleep for 1 hour before next cleanup
            time.sleep(3600)
        except Exception as e:
            print(f"Error in cache cleanup: {str(e)}")
            # Sleep for 5 minutes before retrying
            time.sleep(300)

@app.on_event("startup")
async def startup_event():
    # Start the cache cleanup thread
    cleanup_thread = threading.Thread(target=run_cache_cleanup, daemon=True)
    cleanup_thread.start()
    cache.clear()
    print("Cache cleared on startup")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 