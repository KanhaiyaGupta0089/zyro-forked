"""
Slack Notification Service
Formats and sends notifications to Slack based on different event types
"""
from typing import Dict, Optional, Any
from app.services.slack_service import SlackService
from app.common.errors import ClientErrors
from app.common.logging.logging_config import Logger


class SlackNotificationService:
    """Service for formatting and sending Slack notifications"""

    @staticmethod
    def _format_issue_created_message(issue_data: Dict[str, Any]) -> list:
        """Format message for issue created event
        
        Args:
            issue_data: Dictionary containing issue fields directly (name, status, priority, type)
        """
        status_emoji = {
            "todo": "📋",
            "in_progress": "🔄",
            "in_review": "👀",
            "qa": "🧪",
            "completed": "✅",
            "blocked": "🚫",
        }

        priority_colors = {
            "low": "#36a64f",
            "moderate": "#ffa500",
            "high": "#ff0000",
        }
        
        # issue_data should contain fields directly, not wrapped in "issue" key
        status = issue_data.get("status", "todo").lower()
        priority = issue_data.get("priority", "moderate").lower()
        emoji = status_emoji.get(status, "📋")
        color = priority_colors.get(priority, "#ffa500")

        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{emoji} New Issue Created"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Issue:*\n{issue_data.get('name', 'Untitled')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Status:*\n{status.title()}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Priority:*\n{priority.title()}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Type:*\n{issue_data.get('type', 'Task').title()}"
                    }
                ]
            }
        ]

    @staticmethod
    def _format_issue_updated_message(issue_data: Dict[str, Any], changes: Dict[str, Any]) -> list:
        """Format message for issue updated event
        
        Args:
            issue_data: Dictionary containing issue fields directly (name, status, priority, type)
            changes: Dictionary containing change information
        """
        status_emoji = {
            "todo": "📋",
            "in_progress": "🔄",
            "in_review": "👀",
            "qa": "🧪",
            "completed": "✅",
            "blocked": "🚫",
        }

        # issue_data should contain fields directly, not wrapped in "issue" key
        status = issue_data.get("status", "todo").lower()
        emoji = status_emoji.get(status, "📋")

        fields = [
            {
                "type": "mrkdwn",
                "text": f"*Issue:*\n{issue_data.get('name', 'Untitled')}"
            }
        ]

        # Add changed fields
        if "status" in changes:
            fields.append({
                "type": "mrkdwn",
                "text": f"*Status:*\n{changes['status']['old']} → {changes['status']['new']}"
            })

        if "priority" in changes:
            fields.append({
                "type": "mrkdwn",
                "text": f"*Priority:*\n{changes['priority']['old']} → {changes['priority']['new']}"
            })

        if "assigned_to" in changes:
            fields.append({
                "type": "mrkdwn",
                "text": f"*Assigned To:*\n{changes['assigned_to']['old']} → {changes['assigned_to']['new']}"
            })

        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{emoji} Issue Updated"
                }
            },
            {
                "type": "section",
                "fields": fields
            }
        ]

    @staticmethod
    def _format_issue_assigned_message(issue_data: Dict[str, Any], assignee_name: str) -> list:
        """Format message for issue assigned event
        
        Args:
            issue_data: Dictionary containing issue fields directly (name, status, priority, type)
            assignee_name: Name of the assignee
        """
        # issue_data should contain fields directly, not wrapped in "issue" key
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "👤 Issue Assigned"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Issue:*\n{issue_data.get('name', 'Untitled')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Assigned To:*\n{assignee_name}"
                    }
                ]
            }
        ]

    @staticmethod
    def _format_status_changed_message(issue_data: Dict[str, Any], old_status: str, new_status: str) -> list:
        """Format message for status changed event
        
        Args:
            issue_data: Dictionary containing issue fields directly (name, status, priority, type)
            old_status: Previous status
            new_status: New status
        """
        status_emoji = {
            "todo": "📋",
            "in_progress": "🔄",
            "in_review": "👀",
            "qa": "🧪",
            "completed": "✅",
            "blocked": "🚫",
        }

        new_emoji = status_emoji.get(new_status.lower(), "📋")

        # issue_data should contain fields directly, not wrapped in "issue" key
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{new_emoji} Status Changed"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Issue:*\n{issue_data.get('name', 'Untitled')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Status:*\n{old_status.title()} → {new_status.title()}"
                    }
                ]
            }
        ]

    @staticmethod
    def _format_sprint_message(sprint_data: Dict[str, Any], event_type: str) -> list:
        """Format message for sprint events"""
        emoji = "🚀" if event_type == "started" else "🏁"
        title = "Sprint Started" if event_type == "started" else "Sprint Ended"

        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{emoji} {title}"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Sprint:*\n{sprint_data.get('name', 'Untitled')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Duration:*\n{sprint_data.get('start_date', '')} - {sprint_data.get('end_date', '')}"
                    }
                ]
            }
        ]

    @staticmethod
    def _format_milestone_message(milestone_data: Dict[str, Any]) -> list:
        """Format message for project milestone event"""
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🎯 Project Milestone"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Milestone:*\n{milestone_data.get('name', 'Untitled')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Project:*\n{milestone_data.get('project_name', 'Unknown')}"
                    }
                ]
            }
        ]

    @staticmethod
    async def send_notification(
        webhook_url: str,
        notification_type: str,
        data: Dict[str, Any],
        channel: Optional[str] = None
    ) -> bool:
        """
        Send a formatted notification to Slack
        
        Args:
            webhook_url: Slack webhook URL
            notification_type: Type of notification (issue_created, issue_updated, etc.)
            data: Notification data
            channel: Optional channel override
            
        Returns:
            bool: True if notification sent successfully
        """
        if not webhook_url:
            raise ClientErrors(message="Slack webhook URL is required")

        blocks = None

        if notification_type == "issue_created":
            # Extract issue data from the notification data structure
            issue_data = data.get("issue", data)  # Handle both wrapped and direct formats
            blocks = SlackNotificationService._format_issue_created_message(issue_data)
        elif notification_type == "issue_updated":
            blocks = SlackNotificationService._format_issue_updated_message(
                data.get("issue", {}),
                data.get("changes", {})
            )
        elif notification_type == "issue_assigned":
            blocks = SlackNotificationService._format_issue_assigned_message(
                data.get("issue", {}),
                data.get("assignee_name", "Unknown")
            )
        elif notification_type == "status_changed":
            blocks = SlackNotificationService._format_status_changed_message(
                data.get("issue", {}),
                data.get("old_status", "Unknown"),
                data.get("new_status", "Unknown")
            )
        elif notification_type == "sprint_started":
            blocks = SlackNotificationService._format_sprint_message(data, "started")
        elif notification_type == "sprint_ended":
            blocks = SlackNotificationService._format_sprint_message(data, "ended")
        elif notification_type == "project_milestone":
            blocks = SlackNotificationService._format_milestone_message(data)
        else:
            Logger.warning(f"Unknown notification type: {notification_type}")
            blocks = [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Notification:*\n{notification_type}\n\n{str(data)}"
                    }
                }
            ]

        return await SlackService.send_message(
            webhook_url=webhook_url,
            blocks=blocks,
            username="Zyro Bot",
            icon_emoji=":robot_face:",
            channel=channel
        )
