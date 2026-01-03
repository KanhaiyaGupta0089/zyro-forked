// Project status utility functions

// Based on the actual ProjectStatus enum in backend: ACTIVE, INACTIVE, UPCOMING, DELAYED, COMPLETED
export const getStatusColor = (status?: string) => {
  if (!status) return "bg-gray-100 text-gray-800";

  switch(status.toLowerCase()) {
    case "active":
      return "bg-gray-200 text-gray-800";
    case "inactive":
      return "bg-gray-100 text-gray-800";
    case "upcoming":
      return "bg-gray-200 text-gray-800";
    case "delayed":
      return "bg-gray-800 text-white";
    case "completed":
      return "bg-black text-white";
    // Additional statuses that may be used in the UI
    case "in progress":
      return "bg-gray-200 text-gray-800";
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "archived":
      return "bg-gray-100 text-gray-800";
    case "pending":
      return "bg-gray-200 text-gray-800";
    case "on hold":
      return "bg-gray-800 text-white";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Based on the actual ProjectStatus enum in backend: ACTIVE, INACTIVE, UPCOMING, DELAYED, COMPLETED
export const getStatusIcon = (status?: string) => {
  if (!status) return null;

  switch(status.toLowerCase()) {
    case "active":
    case "inactive":
    case "upcoming":
      return "Clock";
    case "completed":
      return "CheckCircle";
    case "delayed":
    case "pending":
    case "on hold":
      return "AlertCircle";
    case "in progress":
      return "CheckCircle";
    default:
      return "Clock";
  }
};