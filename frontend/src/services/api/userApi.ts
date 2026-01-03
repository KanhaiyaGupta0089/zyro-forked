import axios from "axios";
import { ApiResponse, User, TeamRole } from "./types";

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
   🔹 USER API (USED BY PROJECT TABS)
====================================================== */

export const userApi = {
  /* ===============================
     🔹 CURRENT USER
  =============================== */

  getCurrentUser: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>("/users/me");
    return res.data.data;
  },

  /* ===============================
     🔹 USER DIRECTORY
  =============================== */

  getAllUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<User[]>>("/users");
    return res.data.data ?? [];
  },

  getUserById: async (id: number): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  updateUser: async (
    id: number,
    payload: Partial<User>
  ): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>(
      `/users/${id}`,
      payload
    );
    return res.data.data;
  },
};

/* ======================================================
   🔹 AUTH API (SESSION)
====================================================== */

export const authApi = {
  login: async (credentials: {
    email: string;
    password: string;
  }) => {
    const res = await axios.post<ApiResponse<any>>(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/auth/login`,
      credentials
    );
    return res.data;
  },

  register: async (payload: {
    email: string;
    password: string;
    name: string;
    role?: TeamRole;
  }) => {
    const res = await axios.post<ApiResponse<any>>(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/auth/signup`,
      payload
    );
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  refreshToken: async (refreshToken: string): Promise<string> => {
    const res = await axios.post<ApiResponse<{ access_token: string }>>(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/auth/refresh`,
      { refresh_token: refreshToken }
    );
    return res.data.data.access_token;
  },
};
