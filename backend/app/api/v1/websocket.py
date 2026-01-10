from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import manager
from app.core.security import decode_token
from app.db.connection import AsyncSessionLocal
from app.db.crud.user import get_user_by_id
from app.common.logging.logging_config import Logger
import json

websocket_router = APIRouter()

@websocket_router.websocket("/ws/issues/{project_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: int,
):
    """
    WebSocket endpoint for real-time issue updates via Redis Pub/Sub
    Token should be in query params: ?token=xxx
    """
    user = None
    
    # Get token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        return
    
    # Verify token - decode_token raises ValueError on invalid/expired token
    payload = decode_token(token)
    user_id = payload.get("user_id")
    
    if not user_id:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    # Get user from database
    async with AsyncSessionLocal() as session:
        user = await get_user_by_id(user_id=user_id, session=session)
        
        if not user:
            await websocket.close(code=1008, reason="User not found")
            return
        
        # Accept the connection after authentication
        await websocket.accept()
        Logger.info(f"WebSocket accepted for user {user.id}, project {project_id}")
        
        # Connect to the project room
        await manager.connect(
            websocket=websocket,
            project_id=project_id,
            user_id=user.id,
            user_name=user.name,
        )
        
        # Send welcome message
        await websocket.send_text(json.dumps({
            "type": "connected",
            "message": f"Connected to project {project_id}",
            "user_id": user.id
        }))
        Logger.info(f"Welcome message sent to user {user.id}")
    
    # Message loop - WebSocketDisconnect is a normal disconnection event
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle ping/pong for keepalive
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        # Normal disconnection - clean up
        Logger.info(f"WebSocket disconnected for user {user.id if user else 'unknown'}")
    finally:
        # Ensure cleanup happens
        manager.disconnect(websocket)
        Logger.info(f"WebSocket message loop ended for user {user.id if user else 'unknown'}")
