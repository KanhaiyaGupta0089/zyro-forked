import { createAsyncThunk } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import {
  LoginPayload,
  RegisterPayload,
  GoogleSignInPayload,
  ApiResponse,
  AuthResponseData,
} from "./authTypes";

// Create axios instance without baseURL initially
const API = axios.create({
  withCredentials: true,
});

// Add request interceptor to include token in requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authState') ? 
      JSON.parse(localStorage.getItem('authState')!).token : null;
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add response interceptor to handle token expiration and refresh
API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token from localStorage
        const storedAuthState = localStorage.getItem('authState');
        if (!storedAuthState) {
          throw new Error('No auth state found');
        }

        const authState = JSON.parse(storedAuthState);
        const refreshToken = authState.refresh_token;

        if (!refreshToken) {
          throw new Error('No refresh token found');
        }

        // Call refresh endpoint
        const response = await axios.post<ApiResponse<AuthResponseData>>(
          `${getApiUrl()}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token, user_data } = response.data.data;

        // Update localStorage
        const newAuthState = {
          user: user_data,
          token: access_token,
          refresh_token: refresh_token,
          loading: false,
          error: null,
          isAuthenticated: true,
        };
        localStorage.setItem('authState', JSON.stringify(newAuthState));

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Process queued requests
        processQueue(null, access_token);

        isRefreshing = false;

        // Retry the original request
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth state and redirect to login
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem('authState');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Function to get the API URL dynamically
const getApiUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
};

/* ---------------- LOGIN ---------------- */
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }: LoginPayload, { rejectWithValue }) => {
    try {
      const res = await API.post<ApiResponse<AuthResponseData>>(`${getApiUrl()}/auth/login`, { email, password });
      // The backend returns data in the format: {status, message, data: {access_token, refresh_token, user_data}}
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Login failed"
      );
    }
  }
);

/* ---------------- SIGNUP ---------------- */
export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, email, password, role }: RegisterPayload, { rejectWithValue }) => {
    try {
      const res = await API.post<ApiResponse<AuthResponseData>>(`${getApiUrl()}/auth/signup`, {
        name,
        email,
        password,
        role,
      });
      // The backend returns data in the format: {status, message, data: {access_token, refresh_token, user_data}}
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Signup failed"
      );
    }
  }
);

/* ---------------- GOOGLE SIGN-IN ---------------- */
export const googleSignIn = createAsyncThunk(
  "auth/googleSignIn",
  async ({ id_token }: GoogleSignInPayload, { rejectWithValue }) => {
    try {
      const res = await API.post<ApiResponse<AuthResponseData>>(`${getApiUrl()}/auth/google-signin`, {
        id_token,
      });
      // The backend returns data in the format: {status, message, data: {access_token, refresh_token, user_data}}
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Google sign-in failed"
      );
    }
  }
);

/* ---------------- REFRESH TOKEN ---------------- */
export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const storedAuthState = localStorage.getItem('authState');
      if (!storedAuthState) {
        throw new Error('No auth state found');
      }

      const authState = JSON.parse(storedAuthState);
      const refreshTokenValue = authState.refresh_token;

      if (!refreshTokenValue) {
        throw new Error('No refresh token found');
      }

      const res = await API.post<ApiResponse<AuthResponseData>>(`${getApiUrl()}/auth/refresh`, {
        refresh_token: refreshTokenValue,
      });
      
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Token refresh failed"
      );
    }
  }
);
