from app.db.connection import Base
from sqlalchemy import (
    Column, Integer, 
    String, Boolean, 
    DateTime, ForeignKey,
    func, Enum, 
    Date, Numeric,UniqueConstraint
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.enums import (
    Role, 
    UserStatus,
    ProjectStatus,
    SprintStatus,
    IssueStatus,
    IssueType,
)
from decimal import Decimal


class TimestampMixin:
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class User(Base, TimestampMixin):
    """ Represents a user account in the system"""


    __tablename__ = "user"
    id  = Column(Integer , primary_key = True)
    name = Column(String, nullable = False)
    email= Column(String, nullable = False, unique = True)
    password = Column(String, nullable = False)
    role = Column(Enum(Role), nullable = False)
    story_point = Column(Integer, nullable = True, default = 0)
    status = Column(Enum(UserStatus),nullable = False, default = UserStatus.ACTIVE)

    # Reverse relationships
    assigned_issues = relationship(
        "Issue",
        foreign_keys="[Issue.assigned_to]",
        back_populates="assigned_to_user"
    )
    created_issues = relationship(
        "Issue",
        foreign_keys="[Issue.assigned_by]",
        back_populates="assigned_by_user"
    )

class Project(Base, TimestampMixin):
    """ Represents a project created by a user"""



    __tablename__ = "project"

    id = Column(Integer,primary_key = True,autoincrement = True)
    name = Column(String,nullable = False)
    status = Column(Enum(ProjectStatus,name = "project_enum"),nullable = False, default = ProjectStatus.INACTIVE)
    created_by = Column(Integer,ForeignKey(User.id),nullable = True)
    description = Column(String,nullable = True)
    start_date = Column(Date,nullable = True)
    end_date = Column(Date,nullable = True)
    data = Column(JSONB,nullable = True)
    sprints = relationship(
        "Sprint",
        back_populates = "project",
        cascade = "all, delete-orphan"
    )

class Sprint(Base,TimestampMixin):

    """ Represents a sprint created by a manager/team lead"""

    __tablename__ = "sprint"

    id = Column(Integer,primary_key = True,autoincrement = True)
    sprint_id = Column(String,nullable = False)
    name = Column(String,nullable = False)
    project_id = Column(Integer,ForeignKey(Project.id),nullable = False)
    start_date = Column(Date,nullable = True)
    end_date = Column(Date,nullable = True)
    status = Column(Enum(SprintStatus,name = "sprint_enum"),nullable = False , default = SprintStatus.TODO)
    data = Column(JSONB,nullable = True)
    issues = relationship("Issue", back_populates="sprint", cascade="all, delete-orphan")
    project = relationship(
        "Project",
        back_populates = "sprints",
    )

class Issue(Base,TimestampMixin):
    """ Represents an issue created by a manager/team lead"""

    __tablename__ = "issue"

    id = Column(Integer,primary_key = True,autoincrement = True)
    name = Column(String,nullable = False)
    story_point = Column(Integer,nullable = True,default = 0)
    status = Column(Enum(IssueStatus),nullable = False ,default = IssueStatus.TODO)
    description = Column(String,nullable = True)
    type = Column(Enum(IssueType,name = "issue_type_enum"),nullable = False,default = IssueType.OTHER)
    sprint_id = Column(Integer,ForeignKey(Sprint.id),nullable = True)
    assigned_to = Column(Integer,ForeignKey(User.id),nullable = True)
    assigned_by = Column(Integer,ForeignKey(User.id),nullable = True)
    # Relationships
    sprint = relationship("Sprint", back_populates="issues")
    assigned_to_user = relationship(
        "User",
        foreign_keys=[assigned_to],
        back_populates="assigned_issues"
    )
    assigned_by_user = relationship(
        "User",
        foreign_keys=[assigned_by],
        back_populates="created_issues"
    )

class ProjectMember(Base,TimestampMixin):
    """ Represents a member of a project"""
    __tablename__ = "project_member"

    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "user_id",
            name = "u_project_user"
            ),
    )

    id = Column(Integer,primary_key = True,autoincrement = True)
    project_id = Column(Integer,ForeignKey(Project.id),nullable = False)
    user_id = Column(Integer,ForeignKey(User.id),nullable = False)

    
class Logs(Base,TimestampMixin):
    """ Represents a log of work done by a user on an issue"""

    __tablename__="system_logs"

    id = Column(Integer,primary_key = True,autoincrement = True)
    task_id = Column(Integer,ForeignKey(Issue.id),nullable = False)
    log_id = Column(String,nullable = False)
    date = Column(Date,nullable = False)
    hour_worked = Column(Numeric,nullable = False,default = Decimal(0))
    description = Column(String,nullable = True)

    

