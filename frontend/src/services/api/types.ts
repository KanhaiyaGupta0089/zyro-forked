// Dashboard API Response Types

export interface DashboardStats {
  total_projects: number;
  active_issues: number;
  completed_issues: number;
  team_members: number;
}

export interface Project {
  id: number | string;
  name: string;
  status: string;
  description: string;
  teamMembers: number;
  progress: number;
  lastUpdated: string;
}

export interface Issue {
  id: number | string;
  title: string;
  type: string;
  priority: string;
  status: string;
  assignee: string;
  project: string;
  created: string;
  description: string;
}