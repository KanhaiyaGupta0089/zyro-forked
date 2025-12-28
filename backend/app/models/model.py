from app.db.connection import Base
from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, ForeignKey, func, Enum,
    Date, Numeric, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from decimal import Decimal

from app.core.enums import (
    Role, UserStatus,
    ProjectStatus, SprintStatus,
    IssueStatus, IssueType,
    OrganizationStatus,Priority
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
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)

    role = Column(Enum(Role), nullable=False)
    story_point = Column(Integer, default=0)

    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    


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

    status = Column(Enum(OrganizationStatus, name="organization_enum"),
                    default=OrganizationStatus.INACTIVE,
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

    status = Column(Enum(ProjectStatus, name="project_enum"),
                    default=ProjectStatus.INACTIVE,
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

    status = Column(Enum(SprintStatus, name="sprint_enum"),
                    default=SprintStatus.TODO,
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

    status = Column(Enum(IssueStatus), default=IssueStatus.TODO, nullable=False)
    type = Column(Enum(IssueType, name="issue_type_enum"),
                  default=IssueType.OTHER,
                  nullable=False)
    priority = Column(Enum(Priority,name = 'priority'),
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


# ================= WORK LOGS =================

class Logs(Base, TimestampMixin):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)

    task_id = Column(Integer, ForeignKey(Issue.id), nullable=False)
    log_id = Column(String, nullable=False)

    date = Column(Date, nullable=False)
    hour_worked = Column(Numeric, default=Decimal(0), nullable=False)

    description = Column(String)

    issue = relationship("Issue", back_populates="logs")