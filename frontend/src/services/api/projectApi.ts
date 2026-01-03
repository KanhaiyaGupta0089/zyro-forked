import axios from "axios";
import {
  ApiResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  User,
} from "./types";

/* ======================================================
   🔹 AXIOS INSTANCE
====================================================== */

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  withCredentials: true,
});

/* ======================================================
   🔹 AUTH INTERCEPTORS
====================================================== */

apiClient.interceptors.request.use(
  (config) => {
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
  },
  (error) => Promise.reject(error)
);

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
   🔹 PROJECT API — CORE ONLY
====================================================== */

export const projectApi = {
  /* ===============================
     🔹 PROJECT CRUD
  =============================== */

  getProjects: async (): Promise<Project[]> => {
    const res = await apiClient.get<ApiResponse<Project[]>>("/project");
    return res.data.data;
  },

  getProjectById: async (id: number): Promise<Project> => {
    const res = await apiClient.get<ApiResponse<Project>>(`/project/${id}`);
    return res.data.data;
  },

  createProject: async (
    payload: CreateProjectRequest
  ): Promise<Project> => {
    const res = await apiClient.post<ApiResponse<Project>>(
      "/project",
      payload
    );

    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to create project");
    }

    return res.data.data;
  },

  updateProject: async (
    id: number,
    payload: UpdateProjectRequest
  ): Promise<Project> => {
    const res = await apiClient.put<ApiResponse<Project>>(
      `/project/${id}`,
      payload
    );
    return res.data.data;
  },

  deleteProject: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/project/${id}`);
  },

  /* ===============================
     🔹 PROJECT TEAM
  =============================== */

  getProjectTeam: async (projectId: number): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<User[]>>(
      `/project/${projectId}/team`
    );
    return res.data.data;
  },
};

/* ======================================================
   🔹 EXPORTS (Backward Compatible)
====================================================== */

export const projectService = projectApi;
export const getAll = projectApi.getProjects;
export type { Project };
