import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  LoginPayload,
  RegisterPayload,
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
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token might be expired, clear auth state
      localStorage.removeItem('authState');
      // Optionally dispatch logout action here if store is accessible
    }
    return Promise.reject(error);
  }
);

// Function to get the API URL dynamically
const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
};

/* ---------------- LOGIN ---------------- */
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }: LoginPayload, { rejectWithValue }) => {
    try {
      const res = await API.post(`${getApiUrl()}/auth/login`, { email, password });
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
  async ({ name, email, password }: RegisterPayload, { rejectWithValue }) => {
    try {
      const res = await API.post(`${getApiUrl()}/auth/signup`, {
        name,
        email,
        password,
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