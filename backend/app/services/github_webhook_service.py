"""
GitHub Webhook Service
Handles GitHub webhook events and integrates them with the project management system
"""
from typing import Dict, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.model import Project, Issue, User
from app.db.crud.project_crud import get_project_by_id
from app.db.crud.issue_crud import create_issue, get_issue_by_id, update_issue
from sqlalchemy import select
from app.models.model import Issue
from app.core.enums import IssueStatus, IssueType, Priority
from app.common.errors import NotFoundError
from app.common.logging.logging_config import Logger
from datetime import datetime


class GitHubWebhookService:
    """Service to handle GitHub webhook events"""
    
    @staticmethod
    async def find_project_by_repo(
        session: AsyncSession,
        repo_full_name: str
    ) -> Optional[Project]:
        """
        Find a project by GitHub repository full name (owner/repo)
        Searches in the project's data JSONB field
        """
        try:
            # Query projects where data->>'github_repo' matches the repo
            stmt = select(Project).where(
                Project.data['github_repo'].astext == repo_full_name
            )
            result = await session.execute(stmt)
            project = result.scalar_one_or_none()
            return project
        except Exception as e:
            Logger.error(f"Error finding project by repo {repo_full_name}: {e}")
            return None
    
    @staticmethod
    async def find_user_by_github_username(
        session: AsyncSession,
        github_username: str
    ) -> Optional[User]:
        """
        Find a user by GitHub username
        Searches in user data or email
        """
        try:
            # Try to find by email (GitHub username + @github.com or similar)
            # Or search in user data JSONB if it exists
            stmt = select(User).where(
                User.email.ilike(f"%{github_username}%")
            )
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            return user
        except Exception as e:
            Logger.error(f"Error finding user by GitHub username {github_username}: {e}")
            return None
    
    @staticmethod
    async def find_issue_by_github_number(
        session: AsyncSession,
        project_id: int,
        github_issue_number: int,
        is_pr: bool = False
    ) -> Optional[Issue]:
        """
        Find an issue by GitHub issue number or PR number
        Searches for issues with name starting with "GitHub Issue #{number}:" or "PR #{number}:"
        """
        try:
            if is_pr:
                search_pattern = f"PR #{github_issue_number}:"
            else:
                search_pattern = f"GitHub Issue #{github_issue_number}:"
            
            stmt = select(Issue).where(
                Issue.project_id == project_id,
                Issue.name.like(f"{search_pattern}%")
            )
            result = await session.execute(stmt)
            issue = result.scalar_one_or_none()
            return issue
        except Exception as e:
            Logger.error(f"Error finding issue by GitHub number {github_issue_number}: {e}")
            return None
    
    @staticmethod
    async def handle_push_event(
        session: AsyncSession,
        payload: Dict
    ) -> Dict:
        """
        Handle GitHub push event
        Creates an issue or updates project activity
        """
        try:
            repo = payload.get('repository', {})
            repo_full_name = repo.get('full_name')
            commits = payload.get('commits', [])
            pusher = payload.get('pusher', {})
            pusher_name = pusher.get('name', 'Unknown')
            
            if not repo_full_name:
                return {"status": "skipped", "reason": "No repository info"}
            
            # Find project linked to this repo
            project = await GitHubWebhookService.find_project_by_repo(
                session, repo_full_name
            )
            
            if not project:
                Logger.info(f"No project found for repo: {repo_full_name}")
                return {"status": "skipped", "reason": "No linked project found"}
            
            # Log the push event
            Logger.info(
                f"Push event received for repo {repo_full_name}, "
                f"project {project.id}, {len(commits)} commits"
            )
            
            # You could create a log entry or update project activity here
            # For now, just return success
            return {
                "status": "success",
                "project_id": project.id,
                "commits_count": len(commits),
                "pusher": pusher_name
            }
        except Exception as e:
            Logger.error(f"Error handling push event: {e}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    async def handle_pull_request_event(
        session: AsyncSession,
        payload: Dict
    ) -> Dict:
        """
        Handle GitHub pull request event
        Creates or updates an issue based on PR
        """
        try:
            pr = payload.get('pull_request', {})
            action = payload.get('action')  # opened, closed, merged, etc.
            repo = payload.get('repository', {})
            repo_full_name = repo.get('full_name')
            
            if not repo_full_name or not pr:
                return {"status": "skipped", "reason": "Invalid PR data"}
            
            # Find project
            project = await GitHubWebhookService.find_project_by_repo(
                session, repo_full_name
            )
            
            if not project:
                return {"status": "skipped", "reason": "No linked project found"}
            
            pr_number = pr.get('number')
            pr_title = pr.get('title', 'Untitled PR')
            pr_body = pr.get('body', '')
            pr_url = pr.get('html_url', '')
            pr_state = pr.get('state')  # open, closed
            pr_merged = pr.get('merged', False)
            pr_user = pr.get('user', {})
            pr_author = pr_user.get('login', 'Unknown')
            
            # Find or create issue for this PR
            # Use PR number in issue name to link them
            issue_name = f"PR #{pr_number}: {pr_title}"
            issue_description = f"GitHub Pull Request\n\n{pr_body}\n\nPR URL: {pr_url}"
            
            # Determine issue status based on PR state
            if pr_merged:
                issue_status = IssueStatus.COMPLETED
            elif pr_state == 'closed':
                issue_status = IssueStatus.COMPLETED
            else:
                issue_status = IssueStatus.IN_PROGRESS
            
            # Try to find existing issue by name or create new one
            # For simplicity, we'll create a new issue each time
            # In production, you'd want to link PRs to issues more intelligently
            
            issue_data = {
                'name': issue_name,
                'description': issue_description,
                'project_id': project.id,
                'type': IssueType.TASK.value,
                'status': issue_status.value if hasattr(issue_status, 'value') else issue_status,
                'priority': Priority.MODERATE.value,
                'story_point': 0,
                'time_estimate': 0,  # Required field, default to 0
            }
            
            # Try to find user by GitHub username
            user = await GitHubWebhookService.find_user_by_github_username(
                session, pr_author
            )
            if user:
                issue_data['assigned_to'] = user.id
            
            # Check if issue already exists (for updates)
            existing_issue = await GitHubWebhookService.find_issue_by_github_number(
                session, project.id, pr_number, is_pr=True
            )
            
            if existing_issue:
                # Update existing issue
                updated_issue = await update_issue(
                    session=session,
                    issue_id=existing_issue.id,
                    payload={
                        'name': issue_data['name'],
                        'description': issue_data['description'],
                        'status': issue_data['status'],
                        'type': issue_data['type'],
                        'priority': issue_data['priority'],
                    }
                )
                Logger.info(
                    f"Updated issue {updated_issue.id} for PR #{pr_number} "
                    f"in project {project.id}, action: {action}"
                )
                issue = updated_issue
            else:
                # Create new issue
                issue = await create_issue(
                    session=session,
                    user_id=project.created_by or 1,  # Use project creator or default
                    payload=issue_data
                )
                Logger.info(
                    f"Created issue {issue.id} for PR #{pr_number} "
                    f"in project {project.id}, action: {action}"
                )
            
            return {
                "status": "success",
                "project_id": project.id,
                "issue_id": issue.id,
                "pr_number": pr_number,
                "action": action
            }
        except Exception as e:
            Logger.error(f"Error handling pull request event: {e}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    async def handle_issues_event(
        session: AsyncSession,
        payload: Dict
    ) -> Dict:
        """
        Handle GitHub issues event
        Syncs GitHub issues with project issues
        """
        try:
            github_issue = payload.get('issue', {})
            action = payload.get('action')  # opened, closed, reopened, etc.
            repo = payload.get('repository', {})
            repo_full_name = repo.get('full_name')
            
            if not repo_full_name or not github_issue:
                return {"status": "skipped", "reason": "Invalid issue data"}
            
            # Find project
            project = await GitHubWebhookService.find_project_by_repo(
                session, repo_full_name
            )
            
            if not project:
                return {"status": "skipped", "reason": "No linked project found"}
            
            issue_number = github_issue.get('number')
            issue_title = github_issue.get('title', 'Untitled')
            issue_body = github_issue.get('body', '')
            issue_url = github_issue.get('html_url', '')
            issue_state = github_issue.get('state')  # open, closed
            issue_user = github_issue.get('user', {})
            issue_author = issue_user.get('login', 'Unknown')
            labels = github_issue.get('labels', [])
            
            # Determine issue status
            if issue_state == 'closed':
                issue_status = IssueStatus.COMPLETED
            else:
                issue_status = IssueStatus.TODO
            
            # Determine issue type from labels
            issue_type = IssueType.TASK
            for label in labels:
                label_name = label.get('name', '').lower()
                if 'bug' in label_name:
                    issue_type = IssueType.BUG
                    break
                elif 'feature' in label_name:
                    issue_type = IssueType.FEATURE
                    break
            
            # Determine priority from labels
            priority = Priority.MODERATE
            for label in labels:
                label_name = label.get('name', '').lower()
                if 'critical' in label_name or 'high' in label_name:
                    priority = Priority.HIGH
                    break
                elif 'low' in label_name:
                    priority = Priority.LOW
                    break
            
            issue_name = f"GitHub Issue #{issue_number}: {issue_title}"
            issue_body_text = issue_body if issue_body else "No description provided"
            issue_description = (
                f"GitHub Issue\n\n{issue_body_text}\n\n"
                f"Issue URL: {issue_url}\n"
                f"Labels: {', '.join([l.get('name', '') for l in labels]) if labels else 'None'}"
            )
            
            issue_data = {
                'name': issue_name,
                'description': issue_description,
                'project_id': project.id,
                'type': issue_type.value if hasattr(issue_type, 'value') else issue_type,
                'status': issue_status.value if hasattr(issue_status, 'value') else issue_status,
                'priority': priority.value if hasattr(priority, 'value') else priority,
                'story_point': 0,
                'time_estimate': 0,  # Required field, default to 0
            }
            
            # Try to find user by GitHub username
            user = await GitHubWebhookService.find_user_by_github_username(
                session, issue_author
            )
            if user:
                issue_data['assigned_to'] = user.id
            
            # Check if issue already exists (for updates)
            existing_issue = await GitHubWebhookService.find_issue_by_github_number(
                session, project.id, issue_number
            )
            
            if existing_issue:
                # Update existing issue
                updated_issue = await update_issue(
                    session=session,
                    issue_id=existing_issue.id,
                    payload={
                        'name': issue_data['name'],
                        'description': issue_data['description'],
                        'status': issue_data['status'],
                        'type': issue_data['type'],
                        'priority': issue_data['priority'],
                    }
                )
                Logger.info(
                    f"Updated issue {updated_issue.id} from GitHub issue #{issue_number} "
                    f"in project {project.id}, action: {action}"
                )
                issue = updated_issue
            else:
                # Create new issue
                issue = await create_issue(
                    session=session,
                    user_id=project.created_by or 1,
                    payload=issue_data
                )
                Logger.info(
                    f"Created issue {issue.id} from GitHub issue #{issue_number} "
                    f"in project {project.id}, action: {action}"
                )
            
            return {
                "status": "success",
                "project_id": project.id,
                "issue_id": issue.id,
                "github_issue_number": issue_number,
                "action": action
            }
        except Exception as e:
            Logger.error(f"Error handling issues event: {e}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    async def handle_release_event(
        session: AsyncSession,
        payload: Dict
    ) -> Dict:
        """
        Handle GitHub release event
        """
        try:
            release = payload.get('release', {})
            repo = payload.get('repository', {})
            repo_full_name = repo.get('full_name')
            action = payload.get('action')  # published, etc.
            
            if not repo_full_name:
                return {"status": "skipped", "reason": "No repository info"}
            
            project = await GitHubWebhookService.find_project_by_repo(
                session, repo_full_name
            )
            
            if not project:
                return {"status": "skipped", "reason": "No linked project found"}
            
            Logger.info(
                f"Release event received for repo {repo_full_name}, "
                f"project {project.id}, action: {action}"
            )
            
            return {
                "status": "success",
                "project_id": project.id,
                "action": action
            }
        except Exception as e:
            Logger.error(f"Error handling release event: {e}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    async def process_webhook_event(
        session: AsyncSession,
        event_type: str,
        payload: Dict
    ) -> Dict:
        """
        Process GitHub webhook event based on event type
        """
        handlers = {
            'push': GitHubWebhookService.handle_push_event,
            'pull_request': GitHubWebhookService.handle_pull_request_event,
            'issues': GitHubWebhookService.handle_issues_event,
            'release': GitHubWebhookService.handle_release_event,
        }
        
        handler = handlers.get(event_type)
        if not handler:
            Logger.info(f"Unhandled event type: {event_type}")
            return {
                "status": "skipped",
                "reason": f"Event type '{event_type}' not handled"
            }
        
        try:
            result = await handler(session, payload)
            return result
        except Exception as e:
            Logger.error(f"Error processing {event_type} event: {e}")
            return {"status": "error", "message": str(e)}
