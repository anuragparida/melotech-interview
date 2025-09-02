#!/usr/bin/env python3
"""
Test script for real-time webhook system
"""

import asyncio
import json
import websockets
import requests
import time

# Configuration
BACKEND_URL = "http://localhost:8000"
WEBSOCKET_URL = "ws://localhost:8000/ws/admin"

async def test_websocket_connection():
    """Test WebSocket connection to admin endpoint"""
    print("🔌 Testing WebSocket connection...")
    
    try:
        async with websockets.connect(WEBSOCKET_URL) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Send a test message
            await websocket.send("Hello from test client")
            
            # Wait for echo response
            response = await websocket.recv()
            print(f"📨 Received response: {response}")
            
            # Keep connection alive for a few seconds
            await asyncio.sleep(2)
            
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")

def test_webhook_endpoint():
    """Test the webhook endpoint with sample data"""
    print("\n🔗 Testing webhook endpoint...")
    
    # Sample submission update payload
    payload = {
        "table": "submissions",
        "record": {
            "id": "test-submission-123",
            "title": "Test Track",
            "status": "approved",
            "rating": 8,
            "feedback": "Great track! Approved for release.",
            "updated_at": "2024-01-20T10:30:00Z"
        },
        "old_record": {
            "id": "test-submission-123",
            "title": "Test Track",
            "status": "pending",
            "rating": 0,
            "feedback": "",
            "updated_at": "2024-01-20T09:00:00Z"
        }
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/webhook/submission-update",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Webhook endpoint responded successfully")
            print(f"📄 Response: {response.json()}")
        else:
            print(f"❌ Webhook endpoint failed with status {response.status_code}")
            print(f"📄 Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Webhook test failed: {e}")

def test_health_endpoint():
    """Test the health endpoint"""
    print("\n🏥 Testing health endpoint...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Health endpoint is healthy")
            print(f"📊 Active connections: {health_data.get('active_connections', 0)}")
            print(f"🏠 Active rooms: {health_data.get('active_rooms', [])}")
        else:
            print(f"❌ Health endpoint failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Health check failed: {e}")

async def main():
    """Run all tests"""
    print("🚀 Starting MeloTech Webhook System Tests\n")
    
    # Test health endpoint first
    test_health_endpoint()
    
    # Test WebSocket connection
    await test_websocket_connection()
    
    # Test webhook endpoint
    test_webhook_endpoint()
    
    print("\n✨ Tests completed!")

if __name__ == "__main__":
    asyncio.run(main())
