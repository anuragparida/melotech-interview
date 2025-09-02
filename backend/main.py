"""
MeloTech Backend - Main Application Entry Point
"""

from fastapi import FastAPI
from config import config
from routes import router

# Create FastAPI application
app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    description="Backend service with Mailgun integration for submission status notifications"
)

# Include API routes
app.include_router(router)