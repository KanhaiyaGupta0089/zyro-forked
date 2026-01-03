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

  // GET all users
  getUsers: async () => {
    try {
      const response = await apiClient.get<{ message: string; users: any[] }>('/user/');
      return response.data.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // GET user by ID
  getUserById: async (id: number) => {
    try {
      const response = await apiClient.get<{ message: string; user: any }>(`/user/${id}`);
      return response.data.user;
    } catch (error) {
      console.error(`Error fetching user with id ${id}:`, error);
      throw error;
    }
  },

  // POST create/invite user
  createUser: async (userData: { name: string; email: string; role: string; organization_id: number }) => {
    try {
      const response = await apiClient.post<{ message: string; user_id: number; invite_token?: string }>('/user/create', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // PUT update user
  updateUser: async (id: number, userData: { name?: string; email?: string; role?: string; organization_id?: number; status?: string }) => {
    try {
      const response = await apiClient.put<{ success: boolean; message: string; data: any }>(`/user/${id}`, userData);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      throw error;
    }
  },

  // DELETE user
  deleteUser: async (id: number) => {
    try {
      const response = await apiClient.delete<{ message: string }>(`/user/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user with id ${id}:`, error);
      throw error;
    }
  },

  // POST login
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await axios.post<ApiResponse<any>>(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/auth/login`,
        credentials
      );
      return response.data;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
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
