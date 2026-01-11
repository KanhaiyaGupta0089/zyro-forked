"""
Slack API Endpoints
Handles Slack webhook and notification operations
"""
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.connection import get_db
from app.core.dependencies import allow_min_role
from app.models.model import User
from app.core.enums import Role
from app.services.slack_service import SlackService
from app.services.slack_notification_service import SlackNotificationService
from app.common.errors import ClientErrors, NotFoundError
from app.db.crud.project_crud import get_project_by_id
from app.common.logging.logging_config import Logger
from app.schemas.slack import TestWebhookRequest, SendNotificationRequest

slack_router = APIRouter()




@slack_router.post("/test", status_code=status.HTTP_200_OK)
async def test_webhook(
    request: TestWebhookRequest,
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Test Slack webhook connection
    
    Sends a test message to verify the webhook URL is working correctly.
    """
    if not request.webhook_url or not request.webhook_url.strip():
        raise ClientErrors(message="Webhook URL is required")

    success = await SlackService.test_webhook(request.webhook_url)

    if not success:
        raise ClientErrors(message="Failed to send test message to Slack")

    return {
        "success": True,
        "message": "Test message sent successfully to Slack"
    }


@slack_router.post("/send", status_code=status.HTTP_200_OK)
async def send_notification(
    request: SendNotificationRequest,
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Send a custom notification to Slack
    
    Allows sending formatted notifications to Slack with custom data.
    """
    if not request.webhook_url or not request.webhook_url.strip():
        raise ClientErrors(message="Webhook URL is required")

    if not request.notification_type:
        raise ClientErrors(message="Notification type is required")

    success = await SlackNotificationService.send_notification(
        webhook_url=request.webhook_url,
        notification_type=request.notification_type,
        data=request.data,
        channel=request.channel
    )

    if not success:
        raise ClientErrors(message="Failed to send notification to Slack")

    return {
        "success": True,
        "message": "Notification sent successfully to Slack"
    }


@slack_router.post("/project/{project_id}/test", status_code=status.HTTP_200_OK)
async def test_project_slack_webhook(
    project_id: int,
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Test Slack webhook for a specific project
    
    Tests the Slack integration configured for the project.
    """
    project = await get_project_by_id(
        project_id=project_id,
        user_id=current_user.id,
        session=session
    )

    if not project:
        raise NotFoundError(message="Project not found")

    slack_config = project.data.get("slack") if project.data else None

    if not slack_config:
        raise ClientErrors(message="Slack integration not configured for this project")

    webhook_url = slack_config.get("webhook_url")
    if not webhook_url:
        raise ClientErrors(message="Slack webhook URL not found in project configuration")

    success = await SlackService.test_webhook(webhook_url)

    if not success:
        raise ClientErrors(message="Failed to send test message to Slack")

    return {
        "success": True,
        "message": "Test message sent successfully to Slack",
        "channel": slack_config.get("channel", "#general")
    }


@slack_router.post("/webhook", status_code=status.HTTP_200_OK)
async def slack_webhook(
    payload: dict,
):
    """
    Receive webhook events from Slack (for future slash commands)
    
    This endpoint can be used to handle Slack interactive components,
    slash commands, and other events.
    
    Note: This endpoint does not require authentication as it receives
    webhooks from Slack. Signature verification should be added in production.
    """
    Logger.info(f"Received Slack webhook: {payload}")

    # Future implementation for slash commands and interactive components
    return {
        "success": True,
        "message": "Webhook received",
        "data": payload
    }
