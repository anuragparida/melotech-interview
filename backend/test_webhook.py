#!/usr/bin/env python3
"""
Test script for the submission status update webhook
"""

import requests
import json
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configuration
WEBHOOK_URL = "http://localhost:8000/webhook/submission-status-update"
WEBHOOK_SECRET = "your_webhook_secret_key"  # Replace with your actual secret

def test_webhook():
    """Test the webhook with sample data"""
    
    # Sample webhook payload
    payload = {
        "type": "UPDATE",
        "table": "submissions",
        "record": {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "userid": "user-uuid-here",  # Replace with actual user ID
            "title": "Test Submission - Amazing Track",
            "status": "accepted",
            "feedback": "This is an amazing track! We love the production quality and the melody is fantastic. Looking forward to working with you on this project.",
            "genre": "Electronic",
            "bpm": 128,
            "key": "C Major"
        },
        "old_record": {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "userid": "user-uuid-here",  # Replace with actual user ID
            "title": "Test Submission - Amazing Track",
            "status": "pending",
            "feedback": "",
            "genre": "Electronic",
            "bpm": 128,
            "key": "C Major"
        }
    }
    
    # Headers
    headers = {
        "Content-Type": "application/json",
        "X-Signature": WEBHOOK_SECRET  # Optional: for signature verification
    }
    
    try:
        print("Sending test webhook...")
        print(f"URL: {WEBHOOK_URL}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            WEBHOOK_URL,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            print("\n✅ Webhook test successful!")
        else:
            print(f"\n❌ Webhook test failed with status {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error sending webhook: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

def test_health_endpoint():
    """Test the health check endpoint"""
    
    health_url = "http://localhost:8000/health"
    
    try:
        print("\nTesting health endpoint...")
        response = requests.get(health_url, timeout=10)
        
        print(f"Health Status: {response.status_code}")
        print(f"Health Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Health check successful!")
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error checking health: {e}")

if __name__ == "__main__":
    print("🧪 MeloTech Backend Webhook Test")
    print("=" * 40)
    
    # Test health endpoint first
    test_health_endpoint()
    
    # Test webhook
    test_webhook()
    
    print("\n" + "=" * 40)
    print("Test completed!")
    print("\nNote: Make sure to:")
    print("1. Update the userid in the payload with a real user ID from your database")
    print("2. Ensure the backend server is running on localhost:8000")
    print("3. Configure your .env file with proper credentials")
    print("4. Verify your Mailgun domain and API key are working")
