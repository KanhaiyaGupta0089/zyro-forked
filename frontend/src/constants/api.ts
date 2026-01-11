/**
 * API Constants
 * Centralized API configuration and endpoints
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  
  // Projects
  PROJECT: {
    LIST: '/project',
    CREATE: '/project',
    GET: (id: number) => `/project/${id}`,
    UPDATE: (id: number) => `/project/${id}`,
    DELETE: (id: number) => `/project/${id}`,
  },
  
  // Issues
  ISSUE: {
    LIST: '/issue',
    CREATE: '/issue',
    GET: (id: number) => `/issue/${id}`,
    UPDATE: (id: number) => `/issue/${id}`,
    DELETE: (id: number) => `/issue/${id}`,
  },
  
  // Sprints
  SPRINT: {
    LIST: '/sprint',
    CREATE: '/sprint',
    GET: (id: number) => `/sprint/${id}`,
    UPDATE: (id: number) => `/sprint/${id}`,
    DELETE: (id: number) => `/sprint/${id}`,
    DASHBOARD: '/sprint/sprint-dashboard',
  },
  
  // Attachments
  ATTACHMENT: {
    LIST: (issueId: number) => `/attachment/issue/${issueId}`,
    UPLOAD: (issueId: number) => `/attachment/issue/${issueId}/upload`,
    GET: (id: number) => `/attachment/${id}`,
    DELETE: (id: number) => `/attachment/${id}`,
  },
  
  // Comments
  COMMENT: {
    LIST: (issueId: number) => `/comment/issue/${issueId}`,
    CREATE: '/comment',
    GET: (id: number) => `/comment/${id}`,
    UPDATE: (id: number) => `/comment/${id}`,
    DELETE: (id: number) => `/comment/${id}`,
  },
  
  // Dashboard
  DASHBOARD: {
    MANAGER: '/dashboard/manager',
    EMPLOYEE: '/dashboard/employee',
  },
  
  // Users
  USER: {
    LIST: '/user',
    CREATE: '/user',
    GET: (id: number) => `/user/${id}`,
    UPDATE: (id: number) => `/user/${id}`,
    DELETE: (id: number) => `/user/${id}`,
    TEAM: (userId: number) => `/user/${userId}/team`,
  },
  
  // Organizations
  ORGANIZATION: {
    LIST: '/organization',
    CREATE: '/organization',
    GET: (id: number) => `/organization/${id}`,
    UPDATE: (id: number) => `/organization/${id}`,
  },
  
  // Logs
  LOG: {
    LIST: '/logs',
    CREATE: '/logs',
    GET: (id: number) => `/logs/${id}`,
    UPDATE: (id: number) => `/logs/${id}`,
    DELETE: (id: number) => `/logs/${id}`,
  },
} as const;

export const API_TIMEOUT = 30000; // 30 seconds

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'text/javascript',
  'application/json',
  'text/x-python',
];
