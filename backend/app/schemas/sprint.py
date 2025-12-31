from pydantic import BaseModel
from datetime import date
from app.core.enums import SprintStatus

class SprintResponse(BaseModel):
    id: int
    sprint_id: str
    name: str
    project_id: int
    start_date: date | None
    end_date: date | None
    status: str
    data: dict | None = None
    created_at: str
    updated_at: str


class CreateSprintRequest(BaseModel):
    name: str
    project_id: int
    start_date: date | None
    end_date: date | None
    status: SprintStatus
    data: dict | None = None
    
class UpdateSprintRequest(BaseModel):
    name: str
    start_date: date | None
    end_date: date | None
    status: SprintStatus
    data: dict | None = None