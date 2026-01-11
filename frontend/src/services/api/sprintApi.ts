import axios from "axios";
import {
  ApiResponse,
  Sprint,
  CreateSprintRequest,
  UpdateSprintRequest,
  SprintDashboard,
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
   🔹 SPRINT API
====================================================== */

export const sprintApi = {
  getAll: async (): Promise<Sprint[]> => {
    try {
      const res = await apiClient.get<ApiResponse<Sprint[]>>("/sprint");
      return res.data.data ?? [];
    } catch (error: any) {
      console.error("Sprint API Error:", error.response?.data || error.message);
      throw error;
    }
  },

  getById: async (id: number): Promise<Sprint> => {
    const res = await apiClient.get<ApiResponse<Sprint>>(`/sprint/${id}`);
    return res.data.data;
  },

  getDashboard: async (): Promise<SprintDashboard> => {
    const res = await apiClient.get<ApiResponse<SprintDashboard>>(
      "/sprint/sprint-dashboard"
    );
    return res.data.data;
  },

  create: async (payload: CreateSprintRequest): Promise<Sprint> => {
    const res = await apiClient.post<ApiResponse<Sprint>>("/sprint", payload);
    return res.data.data;
  },

  update: async (
    id: number,
    payload: UpdateSprintRequest
  ): Promise<Sprint> => {
    const res = await apiClient.put<ApiResponse<Sprint>>(
      `/sprint/${id}`,
      payload
    );
    return res.data.data;
  },

  delete: async (id: number): Promise<boolean> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/sprint/${id}`);
    return res.data.success;
  },
};

