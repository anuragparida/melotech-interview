"""
API routes for MeloTech Backend
"""

from typing import Union, Optional
from fastapi import APIRouter, HTTPException, Request, Header, WebSocket, WebSocketDisconnect
from config import config
from handlers.webhook_handler import WebhookHandler
from models import Item
from services.websocket_service import websocket_manager


# Create router
router = APIRouter()

# Initialize webhook handler
webhook_handler = WebhookHandler()


@router.get("/")
def read_root():
    """Root endpoint"""
    return {
        "Hello": "World", 
        "service": f"{config.APP_NAME} with Mailgun Integration",
        "version": config.APP_VERSION
    }


@router.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    """Get item by ID"""
    return {"item_id": item_id, "q": q}


@router.put("/items/{item_id}")
def update_item(item_id: int, item: Item):
    """Update item by ID"""
    return {"item_name": item.name, "item_id": item_id}


@router.post("/webhook/submission-status-update")
async def handle_submission_status_update(
    request: Request,
    x_signature: Optional[str] = Header(None)
):
    """Handle Supabase webhook for submission status updates"""
    
    # Get raw body for signature verification
    body = await request.body()
    body_str = body.decode('utf-8')
    
    # Process webhook
    return webhook_handler.handle_webhook_request(body_str, x_signature)


@router.post("/webhook/submission-update")
async def handle_submission_update(
    request: Request,
    x_signature: Optional[str] = Header(None)
):
    """Handle real-time submission updates for admin dashboard"""
    
    # Get raw body for signature verification
    body = await request.body()
    body_str = body.decode('utf-8')
    
    # Process webhook for real-time updates
    return webhook_handler.handle_realtime_webhook_request(body_str, x_signature)


@router.websocket("/ws/admin")
async def websocket_admin_endpoint(websocket: WebSocket):
    """WebSocket endpoint for admin dashboard real-time updates"""
    await websocket_manager.connect(websocket, "admin")
    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            # Echo back for connection testing
            await websocket_manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)


@router.websocket("/ws/artist/{user_id}")
async def websocket_artist_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for artist real-time updates"""
    await websocket_manager.connect(websocket, "artist", user_id)
    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            # Echo back for connection testing
            await websocket_manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)


@router.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "features": ["mailgun", "supabase_webhooks", "websockets"],
        "active_connections": websocket_manager.get_connection_count(),
        "active_rooms": websocket_manager.get_rooms()
    }
