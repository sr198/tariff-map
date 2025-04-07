from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the app from the backend
from app.main import app

# This is the entry point for Vercel serverless functions
# It simply returns the FastAPI app 