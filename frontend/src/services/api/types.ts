/* ======================================================
   🔹 COMMON / SHARED
====================================================== */

/** Generic API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Base User model */
export interface User {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
}

/* ======================================================
   🔹 DASHBOARD — BACKEND CONTRACT (DO NOT MODIFY)
====================================================== */

export interface DashboardCards {
  my_projects: number;
  active_issues: number;
  team_members: number;
  active_sprints: number;
}

export interface BackendRecentProject {
  project_id: number;
  project_name: string;
  total_task: number;
  task_completed: number;
  project_completion_percentage: number;
  team_members?: ReadonlyArray<{
    id: number;
    name: string;
  }>;
}

export interface BackendRecentIssue {
  task_id: number;
  task_name: string;
  project_name: string;
  status: string;
  priority: string;
  assigned_to: string;
  hours_ago: number;
}

export interface BackendDashboardData {
  cards: DashboardCards;
  recent_projects: BackendRecentProject[];
  recent_issues: BackendRecentIssue[];
}

/* ======================================================
   🔹 DASHBOARD — FRONTEND NORMALIZED MODELS
====================================================== */

export interface DashboardStats {
  total_projects: number;
  active_issues: number;
  active_sprints: number;
  team_members: number;

  /* optional trends */
  projects_trend?: number;
  issues_trend?: number;
  sprints_trend?: number;
  members_trend?: number;
}

export interface RecentProject {
  id: number | string;
  name: string;
  status: ProjectStatus;
  progress: number;
  team_members: number;
  team_members_details?: ReadonlyArray<{
    id: number;
    name: string;
  }>;
  total_task: number;
  task_completed: number;
  last_updated: string;
}

export interface RecentIssue {
  id: number | string;
  title: string;
  priority: IssuePriority;
  status: IssueStatus;
  assignee: string;
  created: string;
  project: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_projects: RecentProject[];
  recent_issues: RecentIssue[];
}

/* ======================================================
   🔹 PROJECT — CORE TYPES
====================================================== */

export type ProjectStatus =
  | "active"
  | "completed"
  | "delayed"
  | "upcoming"
  | "inactive";

export interface Project {
  id: number | string;
  name: string;
  status: ProjectStatus;
  description: string;
  created_by: string;

  start_date: string;
  end_date: string;

  created_at: string;
  updated_at: string;

  /* UI computed */
  teamMembers?: number;
  progress: number;
  lastUpdated?: string;
}

/* ======================================================
   🔹 PROJECT — REQUEST DTOs
====================================================== */

export interface CreateProjectRequest {
  name: string;
  status: ProjectStatus;
  description: string;
  start_date: string;
  end_date: string;
  organization_id: number;
}

export interface UpdateProjectRequest {
  name?: string;
  status?: ProjectStatus;
  description?: string;
  start_date?: string;
  end_date?: string;
}

/* ======================================================
   🔹 TEAM & PERMISSIONS
====================================================== */

export type TeamRole =
  | "owner"
  | "admin"
  | "manager"
  | "member";

export interface ProjectTeamMember extends User {
  role: TeamRole;
}

export interface ProjectPermissions {
  can_edit_project: boolean;
  can_manage_team: boolean;
  can_delete_project: boolean;
}

/* ======================================================
   🔹 ISSUE — CORE TYPES
====================================================== */

export type IssueType =
  | "story"
  | "task"
  | "bug"
  | "epic"
  | "subtask"
  | "feature"
  | "release"
  | "documentation"
  | "other";

export type IssueStatus =
  | "todo"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "hold"
  | "qa"
  | "blocked";

export type IssuePriority =
  | "low"
  | "moderate"
  | "high"
  | "critical";

export interface Issue {
  id: number;
  name: string;
  description?: string;

  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;

  story_point?: number;

  project_id: number;
  project?: Project;

  sprint_id?: number;
  assigned_to?: number;
  assigned_by?: number;

  assignee?: User;
  reporter?: User;

  created_at: string;
  updated_at: string;

  labels?: string[];
}

/* ======================================================
   🔹 ISSUE — REQUEST DTOs
====================================================== */

export interface CreateIssueRequest {
  name: string;
  description?: string;
  type: IssueType;
  status?: IssueStatus;
  priority: IssuePriority;
  story_point?: number;
  project_id: number;
  sprint_id?: number | null;
  assigned_to?: number | null;
}

export interface UpdateIssueRequest {
  name?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
  priority?: IssuePriority;
  story_point?: number;
  assigned_to?: number | null;
}

/* ======================================================
   🔹 ISSUE — UI HELPERS
====================================================== */

export interface IssueFilters {
  search?: string;
  status?: IssueStatus | "all";
  priority?: IssuePriority | "all";
  assignee_id?: number | "me";
}

/* ======================================================
   🔹 KANBAN
====================================================== */

export interface KanbanColumn {
  status: IssueStatus;
  title: string;
  issues: Issue[];
}

export type KanbanBoard = Record<IssueStatus, Issue[]>;
