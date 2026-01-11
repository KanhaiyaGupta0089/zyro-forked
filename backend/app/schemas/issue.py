from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from app.core.enums import IssueStatus,IssueType,Priority

class CreateIssueRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=500, description="Issue name/title")
    description: Optional[str] = Field(None, max_length=5000, description="Issue description")
    story_point: int = Field(0, ge=0, description="Story points")
    status: IssueStatus
    type: IssueType
    priority: Priority
    assigned_to: Optional[int] = None
    sprint_id: Optional[int] = None
    project_id: Optional[int] = None
    time_estimate: Optional[Decimal] = None

class UpdateIssueRequest(BaseModel):
    name:Optional[str] = None
    description:Optional[str] = None
    story_point:Optional[int] = None
    status:Optional[IssueStatus] = None
    type:Optional[IssueType] = None
    priority:Optional[Priority] = None
    assigned_to:Optional[int] = None
    sprint_id:Optional[int] = None
    time_estimate:Optional[Decimal] = None      


class WebsocketIssueUpdate(BaseModel):
    issue_id:int
    status:IssueStatus
    version:int
    board_id:int