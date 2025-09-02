"""
Webhook handler for processing Supabase database webhooks
"""

import hmac
import hashlib
import json
from typing import Optional, Dict, Any
from fastapi import HTTPException
from config import config
from services.mailgun_service import MailgunService
from services.supabase_service import SupabaseService
from services.websocket_service import websocket_manager


class WebhookHandler:
    """Handler for processing webhook requests"""
    
    def __init__(self):
        self.mailgun_service = MailgunService()
        self.supabase_service = SupabaseService()
    
    def verify_webhook_signature(self, payload: str, signature: str, secret: str) -> bool:
        """Verify webhook signature for security"""
        try:
            expected_signature = hmac.new(
                secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            print(f"Error verifying webhook signature: {str(e)}")
            return False
    
    def process_submission_status_update(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Process submission status update webhook"""
        
        # Check if this is a submission update
        if payload.get("table") != "submissions":
            return {"message": "Not a submission update, ignoring"}
        
        # Check if status field was updated
        old_record = payload.get("old_record", {})
        new_record = payload.get("record", {})
        
        old_status = old_record.get("status")
        new_status = new_record.get("status")
        
        # Only send email if status actually changed
        if old_status != new_status and new_status in ["accepted", "rejected", "pending"]:
            userid = new_record.get("userid")
            submission_title = new_record.get("title", "Your Submission")
            feedback = new_record.get("feedback", "")
            
            if userid:
                # Get user email
                user_email = self.supabase_service.get_user_email_by_authid(userid)
                
                if user_email:
                    # Send email notification
                    success = self.mailgun_service.send_status_update_email(
                        user_email=user_email,
                        submission_title=submission_title,
                        status=new_status,
                        feedback=feedback
                    )
                    
                    if success:
                        return {
                            "message": "Email notification sent successfully",
                            "user_email": user_email,
                            "submission_title": submission_title,
                            "status": new_status
                        }
                    else:
                        return {
                            "message": "Failed to send email notification",
                            "user_email": user_email,
                            "submission_title": submission_title,
                            "status": new_status
                        }
                else:
                    return {
                        "message": "User email not found",
                        "userid": userid
                    }
            else:
                return {
                    "message": "No userid found in submission record"
                }
        else:
            return {
                "message": "Status not changed or not a valid status update",
                "old_status": old_status,
                "new_status": new_status
            }
    
    def handle_webhook_request(self, body: str, signature: Optional[str] = None) -> Dict[str, Any]:
        """Handle incoming webhook request"""
        
        try:
            # Verify webhook signature if provided
            if signature and config.WEBHOOK_SECRET:
                if not self.verify_webhook_signature(body, signature, config.WEBHOOK_SECRET):
                    raise HTTPException(status_code=401, detail="Invalid webhook signature")
            
            # Parse the webhook payload
            payload = json.loads(body)
            
            # Process the webhook based on table
            if payload.get("table") == "submissions":
                return self.process_submission_status_update(payload)
            else:
                return {"message": f"Unsupported table: {payload.get('table')}"}
                
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")
        except Exception as e:
            print(f"Error processing webhook: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    def handle_realtime_webhook_request(self, body: str, signature: Optional[str] = None) -> Dict[str, Any]:
        """Handle real-time submission updates for admin dashboard"""
        
        try:
            # Verify webhook signature if provided
            if signature and config.WEBHOOK_SECRET:
                if not self.verify_webhook_signature(body, signature, config.WEBHOOK_SECRET):
                    raise HTTPException(status_code=401, detail="Invalid webhook signature")
            
            # Parse the webhook payload
            payload = json.loads(body)
            
            # Process real-time updates for submissions table
            if payload.get("table") == "submissions":
                return self.process_realtime_submission_update(payload)
            else:
                return {"message": f"Unsupported table for real-time updates: {payload.get('table')}"}
                
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")
        except Exception as e:
            print(f"Error processing real-time webhook: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    def process_realtime_submission_update(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Process real-time submission update webhook"""
        
        # Check if this is a submission update
        if payload.get("table") != "submissions":
            return {"message": "Not a submission update, ignoring"}
        
        # Get the updated record
        new_record = payload.get("record", {})
        old_record = payload.get("old_record", {})
        
        # Extract relevant information
        submission_id = new_record.get("id")
        title = new_record.get("title", "Unknown Title")
        status = new_record.get("status")
        rating = new_record.get("rating")
        feedback = new_record.get("feedback", "")
        
        # Check what fields were updated
        updated_fields = []
        if old_record.get("status") != status:
            updated_fields.append("status")
        if old_record.get("rating") != rating:
            updated_fields.append("rating")
        if old_record.get("feedback") != feedback:
            updated_fields.append("feedback")
        
        # Prepare response data
        response_data = {
            "message": "Real-time submission update processed",
            "submission_id": submission_id,
            "title": title,
            "updated_fields": updated_fields,
            "new_data": {
                "status": status,
                "rating": rating,
                "feedback": feedback
            },
            "timestamp": new_record.get("updated_at")
        }
        
        # Broadcast update to admin WebSocket connections
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're in an async context, schedule the broadcast
                asyncio.create_task(websocket_manager.broadcast_submission_update(response_data, "admin"))
            else:
                # If we're not in an async context, run in a new event loop
                asyncio.run(websocket_manager.broadcast_submission_update(response_data, "admin"))
        except Exception as e:
            print(f"Error broadcasting WebSocket update: {str(e)}")
        
        return response_data