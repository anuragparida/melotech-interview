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


@router.put("/submissions/{submission_id}")
async def update_submission(
    submission_id: str,
    status: Optional[str] = None,
    rating: Optional[int] = None,
    feedback: Optional[str] = None
):
    """Update submission status, rating, and feedback via REST API"""
    
    try:
        # Validate status if provided
        if status and status not in ["pending", "in-review", "approved", "rejected"]:
            raise HTTPException(
                status_code=400, 
                detail="Invalid status. Must be one of: pending, in-review, approved, rejected"
            )
        
        # Validate rating if provided
        if rating is not None and (rating < 1 or rating > 10):
            raise HTTPException(
                status_code=400,
                detail="Rating must be between 1 and 10"
            )
        
        # Update submission in Supabase
        update_data = {}
        if status is not None:
            update_data["status"] = status
        if rating is not None:
            update_data["rating"] = rating
        if feedback is not None:
            update_data["feedback"] = feedback
        
        # Add timestamp
        update_data["updated_at"] = "now()"
        
        # Update in Supabase
        result = webhook_handler.supabase_service.update_submission(submission_id, update_data)
        
        if result:
            # Get the updated submission to send email notification
            submission = webhook_handler.supabase_service.get_submission_by_id(submission_id)
            
            if submission and status in ["pending", "in-review", "approved", "rejected"]:
                # Send email notification
                user_email = webhook_handler.supabase_service.get_user_email_by_userid(submission.get("userid"))
                
                if user_email:
                    email_sent = webhook_handler.mailgun_service.send_status_update_email(
                        user_email=user_email,
                        submission_title=submission.get("title", "Your Submission"),
                        status=status,
                        feedback=feedback or ""
                    )
                    
                    return {
                        "message": "Submission updated successfully",
                        "submission_id": submission_id,
                        "updated_fields": list(update_data.keys()),
                        "email_sent": email_sent,
                        "data": result
                    }
            
            return {
                "message": "Submission updated successfully",
                "submission_id": submission_id,
                "updated_fields": list(update_data.keys()),
                "data": result
            }
        else:
            raise HTTPException(status_code=404, detail="Submission not found")
            
    except Exception as e:
        print(f"Error updating submission: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/submissions/{submission_id}")
async def get_submission(submission_id: str):
    """Get submission by ID"""
    try:
        submission = webhook_handler.supabase_service.get_submission_by_id(submission_id)
        if submission:
            return {"submission": submission}
        else:
            raise HTTPException(status_code=404, detail="Submission not found")
    except Exception as e:
        print(f"Error getting submission: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "features": ["mailgun", "supabase_webhooks", "websockets", "rest_api"],
        "active_connections": websocket_manager.get_connection_count(),
        "active_rooms": websocket_manager.get_rooms()
    }
