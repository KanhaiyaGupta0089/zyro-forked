import axios from 'axios';
import { DashboardStats, Project, Issue } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - maybe redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard API functions
export const dashboardApi = {
  // GET dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // GET recent projects
  getRecentProjects: async (limit: number = 4): Promise<Project[]> => {
    try {
      const response = await apiClient.get<Project[]>(`/dashboard/recent-projects?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent projects:', error);
      throw error;
    }
  },

  // GET recent issues
  getRecentIssues: async (limit: number = 4): Promise<Issue[]> => {
    try {
      const response = await apiClient.get<Issue[]>(`/dashboard/recent-issues?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent issues:', error);
      throw error;
    }
  },

  // GET all dashboard data
  getDashboardData: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },
};