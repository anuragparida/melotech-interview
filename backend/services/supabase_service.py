"""
Supabase service for database operations
"""

from typing import Optional
from supabase import create_client, Client
from config import config


class SupabaseService:
    """Service for Supabase database operations"""
    
    def __init__(self):
        self.client: Client = create_client(
            config.SUPABASE_URL, 
            config.SUPABASE_SERVICE_ROLE_KEY
        )
    
    def get_user_email_by_authid(self, authid: str) -> Optional[str]:
        """Get user email from Supabase auth.users table using authid"""
        try:
            # Query the auth.users table to get email
            response = self.client.table("auth.users").select("email").eq("id", authid).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]["email"]
            else:
                print(f"No user found with authid: {authid}")
                return None
                
        except Exception as e:
            print(f"Error fetching user email: {str(e)}")
            return None
    
    def get_submission_by_id(self, submission_id: str) -> Optional[dict]:
        """Get submission by ID"""
        try:
            response = self.client.table("submissions").select("*").eq("id", submission_id).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            else:
                print(f"No submission found with id: {submission_id}")
                return None
                
        except Exception as e:
            print(f"Error fetching submission: {str(e)}")
            return None
    
    def get_user_submissions(self, userid: str) -> list:
        """Get all submissions for a specific user"""
        try:
            response = self.client.table("submissions").select("*").eq("userid", userid).execute()
            return response.data or []
            
        except Exception as e:
            print(f"Error fetching user submissions: {str(e)}")
            return []
    
    def update_submission_status(self, submission_id: str, status: str, feedback: str = "") -> bool:
        """Update submission status and feedback"""
        try:
            update_data = {"status": status}
            if feedback:
                update_data["feedback"] = feedback
            
            response = self.client.table("submissions").update(update_data).eq("id", submission_id).execute()
            
            if response.data:
                print(f"Successfully updated submission {submission_id} status to {status}")
                return True
            else:
                print(f"Failed to update submission {submission_id}")
                return False
                
        except Exception as e:
            print(f"Error updating submission: {str(e)}")
            return False
    
    def update_submission(self, submission_id: str, update_data: dict) -> Optional[dict]:
        """Update submission with any fields"""
        try:
            response = self.client.table("submissions").update(update_data).eq("id", submission_id).execute()
            
            if response.data and len(response.data) > 0:
                print(f"Successfully updated submission {submission_id}")
                return response.data[0]
            else:
                print(f"Failed to update submission {submission_id}")
                return None
                
        except Exception as e:
            print(f"Error updating submission: {str(e)}")
            return None
    
    def get_user_email_by_userid(self, userid: str) -> Optional[str]:
        """Get user email from users table using userid"""
        try:
            # First get the authid from users table
            user_response = self.client.table("users").select("authid").eq("id", userid).execute()
            
            if user_response.data and len(user_response.data) > 0:
                authid = user_response.data[0]["authid"]
                # Then get email from auth.users
                return self.get_user_email_by_authid(authid)
            else:
                print(f"No user found with userid: {userid}")
                return None
                
        except Exception as e:
            print(f"Error fetching user email by userid: {str(e)}")
            return None