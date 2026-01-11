"""
Slack Notifier Utility
Helper functions to send Slack notifications for various events
"""
from typing import Dict, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.services.slack_notification_service import SlackNotificationService
from app.models.model import Project
from app.common.logging.logging_config import Logger


async def send_slack_notification_for_issue(
    session: AsyncSession,
    project_id: int,
    notification_type: str,
    issue_data: Dict[str, Any],
    additional_data: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Send Slack notification for issue-related events
    
    Args:
        session: Database session
        project_id: Project ID
        notification_type: Type of notification (issue_created, issue_updated, etc.)
        issue_data: Issue data dictionary
        additional_data: Additional data for the notification
        
    Returns:
        bool: True if notification sent successfully, False otherwise
    """
    # Get project to check Slack configuration (direct query, no user validation needed)
    stmt = select(Project).where(Project.id == project_id)
    result = await session.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        Logger.warning(f"Project {project_id} not found for Slack notification")
        return False

    slack_config = project.data.get("slack") if project.data else None

    if not slack_config:
        return False

    webhook_url = slack_config.get("webhook_url")
    if not webhook_url:
        return False

    # Check if this notification type is enabled
    notifications = slack_config.get("notifications", {})
    notification_key_map = {
        "issue_created": "issueCreated",
        "issue_updated": "issueUpdated",
        "issue_assigned": "issueAssigned",
        "status_changed": "issueStatusChanged",
    }

    notification_key = notification_key_map.get(notification_type)
    if notification_key and not notifications.get(notification_key, True):
        # Notification is disabled
        return False

    # Prepare notification data
    notification_data = {
        "issue": issue_data,
        **(additional_data or {})
    }

    channel = slack_config.get("channel")

    # Send notification (don't raise errors, just log them)
    try:
        await SlackNotificationService.send_notification(
            webhook_url=webhook_url,
            notification_type=notification_type,
            data=notification_data,
            channel=channel
        )
        Logger.info(f"Slack notification sent for {notification_type} in project {project_id}")
        return True
    except Exception as e:
        Logger.error(f"Failed to send Slack notification for {notification_type}: {e}")
        return False


async def send_slack_notification_for_sprint(
    session: AsyncSession,
    project_id: int,
    event_type: str,
    sprint_data: Dict[str, Any]
) -> bool:
    """
    Send Slack notification for sprint events
    
    Args:
        session: Database session
        project_id: Project ID
        event_type: Type of event (sprint_started, sprint_ended)
        sprint_data: Sprint data dictionary
        
    Returns:
        bool: True if notification sent successfully, False otherwise
    """
    # Get project to check Slack configuration (direct query, no user validation needed)
    stmt = select(Project).where(Project.id == project_id)
    result = await session.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        return False

    slack_config = project.data.get("slack") if project.data else None
    if not slack_config:
        return False

    webhook_url = slack_config.get("webhook_url")
    if not webhook_url:
        return False

    notifications = slack_config.get("notifications", {})
    notification_key = "sprintStarted" if event_type == "sprint_started" else "sprintEnded"
    
    if not notifications.get(notification_key, False):
        return False

    channel = slack_config.get("channel")

    try:
        await SlackNotificationService.send_notification(
            webhook_url=webhook_url,
            notification_type=event_type,
            data=sprint_data,
            channel=channel
        )
        Logger.info(f"Slack notification sent for {event_type} in project {project_id}")
        return True
    except Exception as e:
        Logger.error(f"Failed to send Slack notification for {event_type}: {e}")
        return False
