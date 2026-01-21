from app.db.connection import Base
from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, ForeignKey, func, Enum,
    Date, Numeric, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy import event
from decimal import Decimal
from app.utils.model_utils import generate_log_id

from app.core.enums import (
    Role, UserStatus,
    ProjectStatus, SprintStatus,
    IssueStatus, IssueType,
    OrganizationStatus,Priority,
    TypeOfSignup
)


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# ================= USER =================

class User(Base, TimestampMixin):
    __tablename__ = "user"
    __table_args__ = (
        Index('idx_user_role', 'role'),
        Index('idx_user_status', 'status'),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    google_user_id = Column(String, nullable=True)
    type_of_signup =Column(Enum(TypeOfSignup,values_callcable= lambda enum:[e.value for e in enum]), default=TypeOfSignup.EMAIL, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=True)
    role = Column(Enum(Role, values_callable=lambda enum: [e.value for e in enum]), nullable=False)
    story_point = Column(Integer, default=0)
    approving_manager_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    reporting_manager_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    approving_manager = relationship("User", foreign_keys=[approving_manager_id], lazy="selectin")
    reporting_manager = relationship("User", foreign_keys=[reporting_manager_id], lazy="selectin")

    status = Column(Enum(UserStatus,values_callable=lambda enum: [e.value for e in enum]), default=UserStatus.ACTIVE, nullable=False)
    def to_dict(self):
        return {
            "id": self.id,
            "google_user_id": self.google_user_id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "status": self.status,
            "story_point": self.story_point,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }


# ================= ORGANIZATION =================

class Organization(Base, TimestampMixin):
    __tablename__ = "organization"
    __table_args__ = (
        Index('idx_org_status', 'status'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(String)

    owner_id = Column(Integer, ForeignKey(User.id), nullable=False)

    status = Column(Enum(OrganizationStatus, name="organization_enum",
                    default=OrganizationStatus.INACTIVE,
                    values_callable=lambda enum: [e.value for e in enum]),
                    nullable=False)

    data = Column(JSONB)

    members = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")


class OrganizationMember(Base, TimestampMixin):
    __tablename__ = "organization_member"

    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="u_org_user"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, ForeignKey(User.id), nullable=False)
    organization_id = Column(Integer, ForeignKey(Organization.id), nullable=False)

    organization = relationship("Organization", back_populates="members")


# ================= PROJECT =================

class Project(Base, TimestampMixin):
    __tablename__ = "project"
    __table_args__ = (
        Index('idx_project_status', 'status'),
        Index('idx_project_created_by', 'created_by'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String, nullable=False)
    description = Column(String)

    status = Column(Enum(ProjectStatus, name="project_enum",
                    default=ProjectStatus.INACTIVE,
                    values_callable=lambda enum: [e.value for e in enum]),
                    nullable=False)

    created_by = Column(Integer, ForeignKey(User.id), nullable=True)

    start_date = Column(Date)
    end_date = Column(Date)
    data = Column(JSONB)

    organization_id = Column(Integer, ForeignKey(Organization.id), nullable=False)

    organization = relationship("Organization", back_populates="projects")
    created_by_user = relationship("User", foreign_keys=[created_by], lazy="selectin")

    sprints = relationship("Sprint", back_populates="project", cascade="all, delete-orphan")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")

    


class ProjectMember(Base, TimestampMixin):
    __tablename__ = "project_member"

    __table_args__ = (
        UniqueConstraint("organization_id", "project_id", "user_id", name="u_org_project_user"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    organization_id = Column(Integer, ForeignKey(Organization.id), nullable=False)
    project_id = Column(Integer, ForeignKey(Project.id), nullable=False)
    user_id = Column(Integer, ForeignKey(User.id), nullable=False)

    project = relationship("Project")
    organization = relationship("Organization")


# ================= SPRINT =================

class Sprint(Base, TimestampMixin):
    __tablename__ = "sprint"

    id = Column(Integer, primary_key=True, autoincrement=True)

    sprint_id = Column(String, nullable=False)
    name = Column(String, nullable=False)

    project_id = Column(Integer, ForeignKey(Project.id), nullable=False)

    start_date = Column(Date)
    end_date = Column(Date)

    status = Column(Enum(SprintStatus, name="sprint_enum",
                    default=SprintStatus.TODO,
                    values_callable=lambda enum: [e.value for e in enum]),
                    nullable=False) 

    data = Column(JSONB)

    project = relationship("Project", back_populates="sprints")
    issues = relationship("Issue", back_populates="sprint", cascade="all, delete-orphan")


# ================= ISSUE =================

class Issue(Base, TimestampMixin):
    __tablename__ = "issue"
    __table_args__ = (
        Index('idx_issue_status', 'status'),
        Index('idx_issue_type', 'type'),
        Index('idx_issue_sprint_id', 'sprint_id'),
        Index('idx_issue_assigned_to', 'assigned_to'),
        Index('idx_issue_assigned_by', 'assigned_by'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String, nullable=False)
    description = Column(String)

    story_point = Column(Integer, default=0)

    status = Column(Enum(IssueStatus, values_callable=lambda enum: [e.value for e in enum]), default=IssueStatus.TODO, nullable=False)
    type = Column(Enum(IssueType, name="issue_type_enum", values_callable=lambda enum: [e.value for e in enum]),
                  default=IssueType.OTHER,
                  nullable=False)
    priority = Column(Enum(Priority,name = 'priority', values_callable=lambda enum: [e.value for e in enum]),
                    default = Priority.MODERATE,
                    nullable = True)
    sprint_id = Column(Integer, ForeignKey(Sprint.id),nullable=True)
    assigned_to = Column(Integer, ForeignKey(User.id),nullable=True)
    assigned_by = Column(Integer, ForeignKey(User.id))

    sprint = relationship("Sprint", back_populates="issues")    

    assignee = relationship("User", foreign_keys=[assigned_to], lazy="selectin")
    reporter = relationship("User", foreign_keys=[assigned_by], lazy="selectin")

    logs = relationship("Logs", back_populates="issue", cascade="all, delete-orphan")
    project_id = Column(Integer, ForeignKey(Project.id), nullable=False)

    project = relationship("Project", foreign_keys=[project_id], lazy="selectin")
    parent_issue_id = Column(Integer, ForeignKey("issue.id"), nullable=True)

    parent_issue = relationship("Issue",
    foreign_keys=[parent_issue_id],
    remote_side=[id],
    back_populates="sub_issues",
    )

    sub_issues = relationship(
        "Issue",
        back_populates="parent_issue",
        cascade="all, delete"
    )
    
    time_estimate = Column(Numeric, default=0, nullable=False)
    
    attachments = relationship("Attachment", back_populates="issue", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="issue", cascade="all, delete-orphan")

# ================= ATTACHMENTS =================

class Attachment(Base, TimestampMixin):
    __tablename__ = "attachment"
    __table_args__ = (
        Index('idx_attachment_issue_id', 'issue_id'),
        Index('idx_attachment_user_id', 'uploaded_by'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    issue_id = Column(Integer, ForeignKey(Issue.id), nullable=False)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    file_type = Column(String, nullable=False)  # MIME type
    file_url = Column(String, nullable=False)  # Cloudinary URL
    cloudinary_public_id = Column(String, nullable=False)  # For deletion
    uploaded_by = Column(Integer, ForeignKey(User.id), nullable=False)
    
    issue = relationship("Issue", back_populates="attachments")
    uploader = relationship("User", foreign_keys=[uploaded_by], lazy="selectin")

# ================= COMMENTS =================

class Comment(Base, TimestampMixin):
    __tablename__ = "comment"
    __table_args__ = (
        Index('idx_comment_issue_id', 'issue_id'),
        Index('idx_comment_user_id', 'user_id'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    issue_id = Column(Integer, ForeignKey(Issue.id), nullable=False)
    user_id = Column(Integer, ForeignKey(User.id), nullable=False)
    content = Column(String, nullable=False)
    edited = Column(Boolean, default=False, nullable=False)
    
    issue = relationship("Issue", back_populates="comments")
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")

# ================= WORK LOGS =================

class Logs(Base, TimestampMixin):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)

    issue_id = Column(Integer, ForeignKey(Issue.id), nullable=False)
    log_id = Column(String, nullable=False)

    date = Column(Date, nullable=False)
    hour_worked = Column(Numeric, default=Decimal(0), nullable=False)

    description = Column(String)

    issue = relationship("Issue", back_populates="logs")
    
    # automatically generate logs id before insert like LOG-221
@event.listens_for(Logs, "before_insert")
def set_log_id(mapper, connection, target):
    if not target.log_id:
        target.log_id = generate_log_id()



class Invite_Tokens(Base, TimestampMixin):
    __tablename__ = 'invite_tokens'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey(User.id), nullable=False)
    token_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)