/**
 * Application Constants
 * Centralized application-wide constants
 */

export const APP_NAME = 'Zyro';
export const APP_VERSION = '1.0.0';

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Issue Status
export const ISSUE_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  HOLD: 'hold',
  QA: 'qa',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type IssueStatus = typeof ISSUE_STATUS[keyof typeof ISSUE_STATUS];

// Issue Types
export const ISSUE_TYPES = {
  STORY: 'story',
  TASK: 'task',
  BUG: 'bug',
  EPIC: 'epic',
  SUBTASK: 'subtask',
  FEATURE: 'feature',
  RELEASE: 'release',
  DOCUMENTATION: 'documentation',
  OTHER: 'other',
} as const;

export type IssueType = typeof ISSUE_TYPES[keyof typeof ISSUE_TYPES];

// Priority Levels
export const PRIORITY = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

// Sprint Status
export const SPRINT_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  TRANSFERRED: 'transferred',
} as const;

export type SprintStatus = typeof SPRINT_STATUS[keyof typeof SPRINT_STATUS];

// Project Status
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_STATE: 'authState',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
} as const;

// Toast Durations
export const TOAST_DURATION = {
  SUCCESS: 2500,
  ERROR: 4500,
  INFO: 3000,
  WARNING: 4000,
} as const;
