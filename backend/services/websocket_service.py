"""
WebSocket service for real-time updates
"""

import json
import asyncio
from typing import Dict, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
from collections import defaultdict


class WebSocketManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Store active connections by room (e.g., "admin", "artist")
        self.active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        # Store connection metadata
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, room: str, user_id: str = None):
        """Accept a WebSocket connection and add to room"""
        await websocket.accept()
        self.active_connections[room].add(websocket)
        self.connection_metadata[websocket] = {
            "room": room,
            "user_id": user_id,
            "connected_at": asyncio.get_event_loop().time()
        }
        print(f"WebSocket connected to room '{room}'")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if websocket in self.connection_metadata:
            room = self.connection_metadata[websocket]["room"]
            self.active_connections[room].discard(websocket)
            del self.connection_metadata[websocket]
            print(f"WebSocket disconnected from room '{room}'")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"Error sending personal message: {str(e)}")
            self.disconnect(websocket)
    
    async def broadcast_to_room(self, message: str, room: str):
        """Broadcast a message to all connections in a room"""
        if room in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[room]:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    print(f"Error broadcasting to room '{room}': {str(e)}")
                    disconnected.add(websocket)
            
            # Remove disconnected connections
            for websocket in disconnected:
                self.disconnect(websocket)
    
    async def broadcast_submission_update(self, submission_data: Dict[str, Any], room: str = "admin"):
        """Broadcast submission update to admin room"""
        message = json.dumps({
            "type": "submission_update",
            "data": submission_data,
            "timestamp": asyncio.get_event_loop().time()
        })
        await self.broadcast_to_room(message, room)
    
    def get_connection_count(self, room: str = None) -> int:
        """Get the number of active connections"""
        if room:
            return len(self.active_connections.get(room, set()))
        return sum(len(connections) for connections in self.active_connections.values())
    
    def get_rooms(self) -> list:
        """Get list of active rooms"""
        return list(self.active_connections.keys())


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
