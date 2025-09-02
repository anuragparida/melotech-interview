"""
Configuration module for MeloTech Backend
Handles environment variables and application settings
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Application configuration class"""
    
    # Supabase Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    # Mailgun Configuration
    MAILGUN_API_KEY = os.getenv("MAILGUN_API_KEY")
    MAILGUN_DOMAIN = os.getenv("MAILGUN_DOMAIN")
    MAILGUN_FROM_EMAIL = os.getenv("MAILGUN_FROM_EMAIL", "noreply@yourdomain.com")
    
    # Webhook Configuration
    WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")
    
    # Application Configuration
    APP_NAME = "MeloTech Backend"
    APP_VERSION = "1.0.0"
    
    @classmethod
    def validate_config(cls):
        """Validate that all required configuration is present"""
        required_vars = [
            "SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY",
            "MAILGUN_API_KEY",
            "MAILGUN_DOMAIN",
            "MAILGUN_FROM_EMAIL"
        ]
        
        missing_vars = []
        for var in required_vars:
            value = getattr(cls, var)
            if not value or value.startswith("your_"):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing or incomplete configuration: {', '.join(missing_vars)}")
        
        return True


# Global config instance
config = Config()
