import axios from "axios";
import {
  ApiResponse,
  BackendDashboardData,
  DashboardData,
  DashboardStats,
  RecentProject,
  RecentIssue,
  IssuePriority,
  IssueStatus,
} from "./types";

/* ======================================================
   🔹 Axios Client
====================================================== */
const apiClient = axios.create({
  withCredentials: true,
});

/* ======================================================
   🔹 Request Interceptor (Auth)
====================================================== */
apiClient.interceptors.request.use(
  (config) => {
    const authStateStr = localStorage.getItem("authState");
    let token: string | null = null;

    if (authStateStr) {
      try {
        const authState = JSON.parse(authStateStr);
        token = authState?.token;
      } catch {
        token = null;
      }
    }

    if (!token) {
      token = localStorage.getItem("access_token");
    }

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    config.baseURL =
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:8000/api/v1";

    return config;
  },
  (error) => Promise.reject(error)
);

/* ======================================================
   🔹 Response Interceptor (Auth Expiry)
====================================================== */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authState");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ======================================================
   🔹 Helpers
====================================================== */
const generateProjectId = (projectName: string) =>
  projectName.toLowerCase().replace(/\s+/g, "-");

/* ======================================================
   🔹 Dashboard API
====================================================== */
export const dashboardApi = {
  /* -----------------------------------------------
     GET: Manager Dashboard
  ------------------------------------------------ */
  getDashboardData: async (): Promise<DashboardData> => {
    const response =
      await apiClient.get<ApiResponse<BackendDashboardData>>(
        "/dashboard/manager"
      );

    const apiData = response.data;

    if (!apiData.success || !apiData.data) {
      throw new Error(apiData.message || "Dashboard fetch failed");
    }

    const backend = apiData.data;

    /* -------------------------------
       🔹 Stats Mapping
    -------------------------------- */
    const stats: DashboardStats = {
      total_projects: backend.cards.my_projects,
      active_issues: backend.cards.active_issues,
      active_sprints: backend.cards.active_sprints,
      team_members: backend.cards.team_members,

      // Backend does not provide trends yet
      projects_trend: 0,
      issues_trend: 0,
      sprints_trend: 0,
      members_trend: 0,
    };

    /* -------------------------------
       🔹 Recent Projects Mapping
    -------------------------------- */
/* -------------------------------
   🔹 Recent Projects Mapping (FIXED)
-------------------------------- */
const recent_projects: RecentProject[] =
  backend.recent_projects.map((project) => {
    // Handle missing team_members field from backend
    const teamMembersArray = project.team_members && Array.isArray(project.team_members)
      ? project.team_members
      : [];

    return {
      id: project.project_id,
      name: project.project_name,
      progress: project.project_completion_percentage,
      total_task: project.total_task,
      task_completed: project.task_completed,

      status:
        project.project_completion_percentage === 100
          ? "completed"
          : "active",

      // ✅ SAFE - use length of teamMembersArray or fallback to 0
      team_members: teamMembersArray.length,
      team_members_details: teamMembersArray,

      last_updated: "Recently updated",
    };
  });


    /* -------------------------------
       🔹 Recent Issues Mapping
    -------------------------------- */
    const mapPriority = (priority: string): IssuePriority => {
      // Map backend priority string to frontend IssuePriority type
      const priorityMap: Record<string, IssuePriority> = {
        'low': 'low',
        'moderate': 'moderate',
        'high': 'high',
        'critical': 'critical',
      };
      return priorityMap[priority.toLowerCase()] || 'moderate'; // default to moderate if unknown
    };

    const mapStatus = (status: string): IssueStatus => {
      // Map backend status string to frontend IssueStatus type
      const statusMap: Record<string, IssueStatus> = {
        'todo': 'todo',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'hold': 'hold',
        'qa': 'qa',
        'blocked': 'blocked',
      };
      return statusMap[status.toLowerCase()] || 'todo'; // default to todo if unknown
    };

    const recent_issues: RecentIssue[] =
      backend.recent_issues.map((issue) => ({
        id: issue.task_id,
        title: issue.task_name,
        project: issue.project_name,
        status: mapStatus(issue.status),
        priority: mapPriority(issue.priority),
        assignee: issue.assigned_to,
        created: `${issue.hours_ago}h ago`,
      }));

    return {
      stats,
      recent_projects,
      recent_issues,
    };
  },
};
