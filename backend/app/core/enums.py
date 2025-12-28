from enum import Enum

class Role(Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"

class UserStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"

class ProjectStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    UPCOMING = "upcoming"
    DELAYED = "delayed"
    COMPLETED = "completed"

class SprintStatus(Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    TRANSFERRED = "transferred"

class IssueStatus(Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    HOLD = "hold"
    QA="qa"
    BLOCKED = "blocked"

class IssueType(Enum):
    STORY = "story"
    TASK = "task"
    BUG = "bug"
    EPIC = "epic"
    SUBTASK = "subtask"
    FEATURE = "feature"
    RELEASE = "release"
    DOCUMENTATION = "documentation"
    OTHER = "other"

class OrganizationStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    
class Priority(Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"
