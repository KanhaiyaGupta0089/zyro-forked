"""
Slack Service
Handles communication with Slack API via webhooks
"""
import httpx
from typing import Dict, Optional, Any
from app.common.errors import ClientErrors, ServerErrors
from app.common.logging.logging_config import Logger


class SlackService:
    """Service for sending messages to Slack via webhooks"""

    @staticmethod
    async def send_message(
        webhook_url: str,
        text: Optional[str] = None,
        blocks: Optional[list] = None,
        channel: Optional[str] = None,
        username: Optional[str] = None,
        icon_emoji: Optional[str] = None,
    ) -> bool:
        """
        Send a message to Slack using webhook URL
        
        Args:
            webhook_url: Slack webhook URL
            text: Plain text message (fallback if blocks not provided)
            blocks: Slack Block Kit blocks for rich formatting
            channel: Override default channel
            username: Override default username
            icon_emoji: Override default emoji icon
            
        Returns:
            bool: True if message sent successfully
            
        Raises:
            ClientErrors: If webhook URL is invalid or request fails
            ServerErrors: If there's a server error
        """
        if not webhook_url or not webhook_url.strip():
            raise ClientErrors(message="Slack webhook URL is required")

        # Validate webhook URL format
        if not webhook_url.startswith("https://hooks.slack.com/services/"):
            raise ClientErrors(message="Invalid Slack webhook URL format")

        payload: Dict[str, Any] = {}

        if blocks:
            payload["blocks"] = blocks
        elif text:
            payload["text"] = text
        else:
            raise ClientErrors(message="Either 'text' or 'blocks' must be provided")

        if channel:
            payload["channel"] = channel
        if username:
            payload["username"] = username
        if icon_emoji:
            payload["icon_emoji"] = icon_emoji

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(webhook_url, json=payload)

            if response.status_code == 200:
                Logger.info(f"Slack message sent successfully to {webhook_url}")
                return True
            elif response.status_code == 404:
                raise ClientErrors(
                    message="Slack webhook URL not found. Please verify the webhook URL is correct.",
                    response_code=404
                )
            elif response.status_code == 400:
                error_text = response.text
                raise ClientErrors(
                    message=f"Invalid Slack webhook request: {error_text}",
                    response_code=400
                )
            else:
                error_text = response.text
                raise ServerErrors(
                    message=f"Failed to send Slack message: {error_text}",
                    response_code=response.status_code
                )

    @staticmethod
    async def test_webhook(webhook_url: str) -> bool:
        """
        Test Slack webhook connection by sending a test message
        
        Args:
            webhook_url: Slack webhook URL to test
            
        Returns:
            bool: True if test message sent successfully
        """
        test_blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "✅ *Test Message from Zyro*\n\nThis is a test notification to verify your Slack integration is working correctly."
                }
            }
        ]

        return await SlackService.send_message(
            webhook_url=webhook_url,
            blocks=test_blocks,
            username="Zyro Bot",
            icon_emoji=":robot_face:"
        )
