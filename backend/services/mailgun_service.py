"""
Mailgun email service for sending submission status notifications
"""

import requests
from typing import Optional
from config import config


class MailgunService:
    """Service for sending emails via Mailgun API"""
    
    def __init__(self):
        self.api_key = config.MAILGUN_API_KEY
        self.domain = config.MAILGUN_DOMAIN
        self.from_email = config.MAILGUN_FROM_EMAIL
        self.base_url = f"https://api.mailgun.net/v3/{self.domain}"
    
    def send_status_update_email(
        self, 
        user_email: str, 
        submission_title: str, 
        status: str, 
        feedback: str = ""
    ) -> bool:
        """Send email notification when submission status is updated"""
        
        template = self._get_email_template(status, submission_title, feedback)
        
        try:
            response = requests.post(
                f"{self.base_url}/messages",
                auth=("api", self.api_key),
                data={
                    "from": self.from_email,
                    "to": user_email,
                    "subject": template["subject"],
                    "text": template["text"],
                    "html": template["html"]
                }
            )
            
            if response.status_code == 200:
                print(f"Email sent successfully to {user_email} for submission '{submission_title}' with status '{status}'")
                return True
            else:
                print(f"Failed to send email: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
    
    def _get_email_template(self, status: str, submission_title: str, feedback: str) -> dict:
        """Get email template based on status"""
        
        templates = {
            "accepted": {
                "subject": "🎉 Your Submission Has Been Accepted!",
                "html": f"""
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #10b981;">Great News!</h2>
                    <p>Your submission "<strong>{submission_title}</strong>" has been <strong>accepted</strong>!</p>
                    <p>Congratulations! We're excited to work with you on this project.</p>
                    {f'<p><strong>Feedback:</strong> {feedback}</p>' if feedback else ''}
                    <p>Thank you for your submission and we look forward to hearing more from you!</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The MeloTech Team</p>
                </body>
                </html>
                """,
                "text": f"Great News! Your submission '{submission_title}' has been accepted! Congratulations! We're excited to work with you on this project. {f'Feedback: {feedback}' if feedback else ''} Thank you for your submission and we look forward to hearing more from you! Best regards, The MeloTech Team"
            },
            "rejected": {
                "subject": "Update on Your Submission",
                "html": f"""
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #ef4444;">Submission Update</h2>
                    <p>Thank you for your submission "<strong>{submission_title}</strong>".</p>
                    <p>Unfortunately, we won't be able to move forward with this particular submission at this time.</p>
                    {f'<p><strong>Feedback:</strong> {feedback}</p>' if feedback else ''}
                    <p>We encourage you to keep creating and submitting new work. We're always looking for fresh talent!</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The MeloTech Team</p>
                </body>
                </html>
                """,
                "text": f"Thank you for your submission '{submission_title}'. Unfortunately, we won't be able to move forward with this particular submission at this time. {f'Feedback: {feedback}' if feedback else ''} We encourage you to keep creating and submitting new work. We're always looking for fresh talent! Best regards, The MeloTech Team"
            },
            "pending": {
                "subject": "Your Submission is Under Review",
                "html": f"""
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #f59e0b;">Submission Under Review</h2>
                    <p>Your submission "<strong>{submission_title}</strong>" is now under review.</p>
                    <p>We'll get back to you as soon as possible with our decision.</p>
                    <p>Thank you for your patience!</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The MeloTech Team</p>
                </body>
                </html>
                """,
                "text": f"Your submission '{submission_title}' is now under review. We'll get back to you as soon as possible with our decision. Thank you for your patience! Best regards, The MeloTech Team"
            }
        }
        
        return templates.get(status, templates["pending"])
