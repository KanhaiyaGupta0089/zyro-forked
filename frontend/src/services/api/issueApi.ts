import axios from "axios";
import {
  ApiResponse,
  Issue,
  CreateIssueRequest,
  UpdateIssueRequest,
  IssueStatus,
  IssuePriority,
  IssueType,
  IssueFilters,
} from "./types";

/* ======================================================
   🔹 AXIOS INSTANCE
====================================================== */

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  withCredentials: true,
});

/* ======================================================
   🔹 REQUEST INTERCEPTOR (AUTH)
====================================================== */

apiClient.interceptors.request.use((config) => {
  let token: string | null = null;

  try {
    const authState = localStorage.getItem("authState");
    if (authState) {
      token = JSON.parse(authState)?.token;
    }
  } catch {
    token = null;
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

  return config;
});

/* ======================================================
   🔹 RESPONSE INTERCEPTOR (TOKEN EXPIRY)
====================================================== */

apiClient.interceptors.response.use(
  (res) => res,
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
   🔹 ISSUE API — CORE ONLY
====================================================== */

export const issueApi = {
  /* ===============================
     🔹 CORE CRUD
  =============================== */

  getAll: async (): Promise<Issue[]> => {
    const res = await apiClient.get<ApiResponse<Issue[]>>("/issue");
    return res.data.data ?? [];
  },

  getById: async (id: number): Promise<Issue> => {
    const res = await apiClient.get<ApiResponse<Issue>>(`/issue/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateIssueRequest): Promise<Issue> => {
    const res = await apiClient.post<ApiResponse<Issue>>("/issue", payload);
    return res.data.data;
  },

  update: async (
    id: number,
    payload: UpdateIssueRequest
  ): Promise<Issue> => {
    const res = await apiClient.put<ApiResponse<Issue>>(
      `/issue/${id}`,
      payload
    );
    return res.data.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/issue/${id}`);
  },

  /* ===============================
     🔹 PROJECT-SCOPED QUERIES
  =============================== */

  getByProject: async (projectId: number): Promise<Issue[]> => {
    const res = await apiClient.get<ApiResponse<Issue[]>>(
      `/issue?project_id=${projectId}`
    );
    return res.data.data ?? [];
  },

  getByProjectAndStatus: async (
    projectId: number,
    status: IssueStatus
  ): Promise<Issue[]> => {
    const res = await apiClient.get<ApiResponse<Issue[]>>(
      `/issue?project_id=${projectId}&status=${status}`
    );
    return res.data.data ?? [];
  },

  /* ===============================
     🔹 FILTERED SEARCH
  =============================== */

  getWithFilters: async (
    projectId: number,
    filters: IssueFilters
  ): Promise<Issue[]> => {
    const params = new URLSearchParams();
    params.append("project_id", projectId.toString());

    if (filters.search) params.append("search", filters.search);
    if (filters.status && filters.status !== "all")
      params.append("status", filters.status);
    if (filters.priority && filters.priority !== "all")
      params.append("priority", filters.priority);
    if (filters.assignee_id)
      params.append(
        "assignee_id",
        filters.assignee_id === "me"
          ? "me"
          : filters.assignee_id.toString()
      );

    const res = await apiClient.get<ApiResponse<Issue[]>>(
      `/issue?${params.toString()}`
    );

    return res.data.data ?? [];
  },

  /* ===============================
     🔹 SUB-ISSUES
  =============================== */

  getSubIssues: async (issueId: number): Promise<Issue[]> => {
    const res = await apiClient.get<ApiResponse<Issue[]>>(
      `/issue/sub-issues/${issueId}`
    );
    return res.data.data ?? [];
  },

  /* ===============================
     🔹 LOGS
  =============================== */

  getLogsByIssue: async (issueId: number): Promise<any[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>(
      `/issue/logs/${issueId}`
    );
    return res.data.data ?? [];
  },
};

/* ======================================================
   🔹 EXPORT TYPES (CONVENIENCE)
====================================================== */

export type {
  Issue,
  IssueStatus,
  IssuePriority,
  IssueType,
  CreateIssueRequest,
  UpdateIssueRequest,
};
