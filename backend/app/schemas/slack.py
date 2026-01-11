from pydantic import BaseModel, Field
from typing import Optional

class TestWebhookRequest(BaseModel):
    webhook_url: str = Field(..., description="Slack webhook URL to test")


class SendNotificationRequest(BaseModel):
    webhook_url: str = Field(..., description="Slack webhook URL")
    notification_type: str = Field(..., description="Type of notification")
    data: dict = Field(..., description="Notification data")
    channel: Optional[str] = Field(None, description="Optional channel override")