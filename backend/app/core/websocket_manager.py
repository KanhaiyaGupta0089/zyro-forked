from typing import Dict, Set
from fastapi import WebSocket
import json
import asyncio
from app.common.logging.logging_config import Logger
from app.core.redis_config import async_redis_client

class ConnectionManager:
    def __init__(self):
        # Store active connections: {project_id: {websocket1, websocket2, ...}}
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Store user info for each connection
        self.connection_info: Dict[WebSocket, dict] = {}
        # Store Redis pubsub for each project
        self.pubsubs: Dict[int, any] = {}
        # Store background tasks for Redis listeners
        self.listener_tasks: Dict[int, asyncio.Task] = {}
    
    async def connect(self, websocket: WebSocket, project_id: int, user_id: int, user_name: str):
        # Note: websocket.accept() should be called in the endpoint before calling this method
        
        if project_id not in self.active_connections:
            self.active_connections[project_id] = set()
        
        self.active_connections[project_id].add(websocket)
        self.connection_info[websocket] = {
            "project_id": project_id,
            "user_id": user_id,
            "user_name": user_name
        }
        
        # Start Redis listener for this project if not already started
        # Don't raise if Redis fails - allow WebSocket to continue without Redis
        if project_id not in self.pubsubs:
            await self._start_redis_listener(project_id)
        
        Logger.info(f"WebSocket connected: User {user_id} to project {project_id}")
    
    async def _start_redis_listener(self, project_id: int):
        """Start listening to Redis Pub/Sub for a project"""
        await async_redis_client.ping()
        Logger.info(f"Redis connection OK for project {project_id}")
        
        pubsub = async_redis_client.pubsub()
        channel_name = f"project:{project_id}:updates"
        Logger.info(f"Subscribing to Redis channel: {channel_name}")
        await pubsub.subscribe(channel_name)
        
        self.pubsubs[project_id] = pubsub
        
        # Start background task to listen for messages
        task = asyncio.create_task(self._redis_listener(project_id, pubsub))
        self.listener_tasks[project_id] = task
        
        Logger.info(f"Started Redis listener task for project {project_id}")
    
    async def _redis_listener(self, project_id: int, pubsub):
        """Listen to Redis messages and broadcast to WebSocket connections"""
        Logger.info(f"Redis listener started and waiting for messages for project {project_id}")
        try:
            while True:
                try:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if message and message['type'] == 'message':
                        data = json.loads(message['data'])
                        Logger.info(f"Received Redis message for project {project_id}: {data.get('type', 'unknown')}")
                        await self.broadcast_to_project(project_id, data)
                        connection_count = len(self.active_connections.get(project_id, set()))
                        Logger.info(f"Broadcasted message to {connection_count} WebSocket connections")
                except asyncio.TimeoutError:
                    # Timeout is normal, continue waiting
                    continue
                except json.JSONDecodeError as e:
                    Logger.error(f"Error decoding Redis message: {e}, raw data: {message.get('data', '') if message else 'N/A'}")
                except asyncio.CancelledError:
                    raise
        except asyncio.CancelledError:
            Logger.info(f"Redis listener for project {project_id} cancelled")
        finally:
            await pubsub.unsubscribe()
            await pubsub.close()
            Logger.info(f"Redis listener closed for project {project_id}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.connection_info:
            info = self.connection_info[websocket]
            project_id = info["project_id"]
            
            if project_id in self.active_connections:
                self.active_connections[project_id].discard(websocket)
                # If no more connections, stop Redis listener
                if not self.active_connections[project_id]:
                    del self.active_connections[project_id]
                    # Cancel Redis listener task
                    if project_id in self.listener_tasks:
                        self.listener_tasks[project_id].cancel()
                        del self.listener_tasks[project_id]
                    if project_id in self.pubsubs:
                        del self.pubsubs[project_id]
            
            del self.connection_info[websocket]
            Logger.info(f"WebSocket disconnected: User {info['user_id']} from project {project_id}")
    
    async def broadcast_to_project(self, project_id: int, message: dict, exclude_websocket: WebSocket = None):
        """Broadcast a message to all connections in a project"""
        if project_id not in self.active_connections:
            Logger.warning(f"No active connections for project {project_id}")
            return
        
        disconnected = set()
        message_json = json.dumps(message)
        connection_count = len(self.active_connections[project_id])
        
        Logger.info(f"Broadcasting message to {connection_count} connections for project {project_id}, message type: {message.get('type', 'unknown')}")
        
        for connection in self.active_connections[project_id]:
            if connection == exclude_websocket:
                continue
            
            try:
                await connection.send_text(message_json)
            except Exception:
                # Connection is closed, mark for cleanup
                disconnected.add(connection)
        
        # Clean up disconnected connections
        for conn in disconnected:
            self.disconnect(conn)

# Global instance
manager = ConnectionManager()