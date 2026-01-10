import { SprintStatus } from "@/services/api/types";

/* ======================================================
   🔹 SPRINT STATUS CONFIGURATION
====================================================== */

export interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeColor: string;
}

export const SPRINT_STATUS_CONFIG: Record<SprintStatus, StatusConfig> = {
  todo: {
    label: "To Do",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    badgeColor: "bg-gray-100 text-gray-700",
  },
  in_progress: {
    label: "In Progress",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "Completed",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    badgeColor: "bg-green-100 text-green-700",
  },
  cancelled: {
    label: "Cancelled",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    badgeColor: "bg-red-100 text-red-700",
  },
  transferred: {
    label: "Transferred",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
    badgeColor: "bg-yellow-100 text-yellow-700",
  },
};

/* ======================================================
   🔹 UTILITIES
====================================================== */

export const getStatusConfig = (status: SprintStatus): StatusConfig => {
  return SPRINT_STATUS_CONFIG[status] || SPRINT_STATUS_CONFIG.todo;
};

export const formatDate = (date: string | null): string => {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDateRange = (
  startDate: string | null,
  endDate: string | null
): string => {
  if (!startDate || !endDate) return "Not set";
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} - ${end}`;
};

export const getDaysRemaining = (endDate: string | null): number | null => {
  if (!endDate) return null;
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getSprintProgress = (
  totalIssues: number,
  completedIssues: number
): number => {
  if (totalIssues === 0) return 0;
  return Math.round((completedIssues / totalIssues) * 100);
};




