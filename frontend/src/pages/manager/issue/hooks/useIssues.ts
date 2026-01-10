import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { issueApi } from "@/services/api/issueApi";
import { projectService } from "@/services/api/projectApi";
import {
  Issue as ApiIssue,
  IssueStatus,
  Project,
} from "@/services/api/types";
import { ApiError } from "@/types/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { RootState } from "@/redux/store";

export interface UIIssue {
  id: string;
  title: string;
  type: any;
  priority: "low" | "medium" | "high" | "critical";
  status: IssueStatus;
  assignee: { name: string; avatar: string; id?: number };
  reporter: { name: string; avatar: string; id?: number };
  project: { key: string; name: string; id?: number };
  created: string;
  updated: string;
  labels: string[];
  storyPoints?: number;
  apiId?: number;
}

const getProjectKey = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
};

const getUserInitials = (name: string): string => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

const transformIssueToUI = (apiIssue: ApiIssue, project?: any): UIIssue => {
  const issueProject = apiIssue.project || project;
  const projectName = issueProject?.name || "Unknown Project";
  const projectKey = getProjectKey(projectName);
  const issueId = `${projectKey}-${apiIssue.id}`;

  const priorityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
    low: "low",
    moderate: "medium",
    high: "high",
    critical: "critical",
  };

  return {
    id: issueId,
    title: apiIssue.name,
    type: apiIssue.type,
    priority: priorityMap[apiIssue.priority || "moderate"] || "medium",
    status: apiIssue.status,
    assignee: {
      name: apiIssue.assignee?.name || "Unassigned",
      avatar: getUserInitials(apiIssue.assignee?.name || "Unassigned"),
      id: apiIssue.assignee?.id || apiIssue.assigned_to || undefined,
    },
    reporter: {
      name: apiIssue.reporter?.name || "Unknown",
      avatar: getUserInitials(apiIssue.reporter?.name || "Unknown"),
      id: apiIssue.reporter?.id || apiIssue.assigned_by || undefined,
    },
    project: {
      key: projectKey,
      name: projectName,
      id: (issueProject?.id as number) || (apiIssue.project_id as number) || undefined,
    },
    created: formatTimeAgo(apiIssue.created_at),
    updated: formatTimeAgo(apiIssue.updated_at),
    labels: [],
    storyPoints: apiIssue.story_point || 0,
    apiId: apiIssue.id,
  };
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Define the cache type
interface CacheData {
  issues: UIIssue[];
  projects: Project[];
  timestamp: number;
}

// Simple cache to prevent redundant API calls
let cachedData: CacheData | null = null;

// Local storage cache functions
const CACHE_KEY = 'issues_cache';

const getCacheFromStorage = (): CacheData | null => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    
    // Check if cache is still valid
    if (Date.now() - parsed.timestamp < CACHE_DURATION) {
      return parsed;
    } else {
      // Remove expired cache
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  } catch (error) {
    console.error('Error reading cache from localStorage:', error);
    return null;
  }
};

const setCacheToStorage = (data: CacheData) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving cache to localStorage:', error);
  }
};

export const useIssues = () => {
  // Initialize with cached data from local storage
  const initialCachedData = cachedData || getCacheFromStorage();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [issues, setIssues] = useState<UIIssue[]>(initialCachedData ? initialCachedData.issues : []);
  const [projects, setProjects] = useState<Project[]>(initialCachedData ? initialCachedData.projects : []);
  const [isLoading, setIsLoading] = useState(initialCachedData ? false : true);

  const loadData = useCallback(async () => {
    // Check if we have valid cached data
    const currentCachedData = cachedData || getCacheFromStorage();
    if (currentCachedData && Date.now() - currentCachedData.timestamp < CACHE_DURATION) {
      setIssues(currentCachedData.issues);
      setProjects(currentCachedData.projects);
      return;
    }
    
    try {
      setIsLoading(true);

      // Load issues and projects in parallel
      const [issuesResponse, projectsResponse] = await Promise.allSettled([
        issueApi.getAll(),
        projectService.getProjects()
      ]);

      let issuesData: ApiIssue[] = [];
      let projectsData: Project[] = [];

      // Handle issues response
      if (issuesResponse.status === 'fulfilled') {
        // The API returns the array directly, not wrapped in an ApiResponse
        issuesData = Array.isArray(issuesResponse.value) ? issuesResponse.value : [];
      } else {
        console.error("Error loading issues:", issuesResponse.reason);
        toast.error("Failed to load issues");
      }

      // Handle projects response
      if (projectsResponse.status === 'fulfilled') {
        // The API returns the array directly, not wrapped in an ApiResponse
        projectsData = Array.isArray(projectsResponse.value) ? projectsResponse.value : [];
      } else {
        console.error("Error loading projects:", projectsResponse.reason);
        toast.error("Failed to load projects");
      }

      // Create projects map for quick lookup
      const projectsMap = new Map(projectsData.map((p: Project) => [p.id as number, p]));
      setProjects(projectsData);

      // Transform issues to UI format
      const uiIssues = issuesData
        .map((apiIssue: ApiIssue) => {
          try {
            const project = apiIssue.project || (apiIssue.project_id ? projectsMap.get(apiIssue.project_id as number) : undefined);
            return transformIssueToUI(apiIssue, project);
          } catch (error) {
            console.error("Error transforming issue:", apiIssue, error);
            return null;
          }
        })
        .filter((issue: UIIssue | null): issue is UIIssue => issue !== null);

      setIssues(uiIssues);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load issues");
      setIssues([]);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get unique project IDs from issues for WebSocket connections
  const uniqueProjectIds = useMemo(() => {
    const projectIds = new Set<number>();
    issues.forEach((issue) => {
      if (issue.project.id) {
        projectIds.add(issue.project.id);
      }
    });
    return Array.from(projectIds);
  }, [issues]);

  // Handle WebSocket messages for real-time updates
  const handleWebSocketMessage = useCallback(
    (message: any) => {
      console.log("Received WebSocket message:", message);
      console.log("Message type:", message.type);
      
      if (message.type === "issue_updated") {
        const updatedIssueData = message.data;
        console.log("Processing issue_updated:", updatedIssueData);
        
        setIssues((prevIssues) => {
          return prevIssues.map((issue) => {
            // Match by apiId
            if (issue.apiId === updatedIssueData.id) {
              // Find the project for this issue
              const project = projects.find(
                (p) => p.id === updatedIssueData.project_id
              );
              
              // Transform the updated issue to UI format
              const apiIssue: ApiIssue = {
                id: updatedIssueData.id,
                name: updatedIssueData.name,
                status: updatedIssueData.status,
                priority: updatedIssueData.priority,
                type: updatedIssueData.type || issue.type,
                assigned_to: updatedIssueData.assigned_to,
                project_id: updatedIssueData.project_id,
                created_at: updatedIssueData.created_at || issue.created,
                updated_at: updatedIssueData.updated_at,
                story_point: updatedIssueData.story_point || issue.storyPoints,
                assignee: updatedIssueData.assignee || issue.assignee,
                reporter: updatedIssueData.reporter || issue.reporter,
                project: project || issue.project,
              };
              
              return transformIssueToUI(apiIssue, project);
            }
            return issue;
          });
        });

        // Show notification for status updates (drag-drop or form updates)
        if (updatedIssueData.status) {
          if (updatedIssueData.updated_by && updatedIssueData.updated_by.name) {
            const updatedByName = updatedIssueData.updated_by.name;
            const currentUserId = currentUser?.id;
            const updatedById = updatedIssueData.updated_by.id;
            
            // Show notification if updated by someone else, or show for all status changes
            if (currentUserId !== updatedById) {
              toast.success(
                `Issue ${updatedIssueData.id} updated by ${updatedByName}`,
                { duration: 3000 }
              );
            } else {
              // Show notification for own updates too (for drag-drop feedback)
              toast.success(
                `Issue ${updatedIssueData.id} status updated to ${updatedIssueData.status}`,
                { duration: 2000 }
              );
            }
          } else {
            // Fallback: show notification for status updates even without updated_by
            toast.success(
              `Issue ${updatedIssueData.id} status updated`,
              { duration: 3000 }
            );
          }
        }
      } else if (message.type === "issue_created") {
        // Reload data to get the new issue with all details
        loadData();
        toast.success("New issue created", { duration: 3000 });
      } else if (message.type === "issue_deleted") {
        const deletedIssueId = message.data?.issue_id;
        if (deletedIssueId) {
          setIssues((prevIssues) =>
            prevIssues.filter((issue) => issue.apiId !== deletedIssueId)
          );
          toast.success("Issue deleted", { duration: 3000 });
        }
      } else {
        console.log("Unhandled WebSocket message type:", message.type, message);
      }
    },
    [projects, loadData, currentUser]
  );

  // Connect WebSocket for the first project (or primary project)
  // Note: For multiple projects, you may want to connect to all of them
  // For now, we connect to the first project that has issues
  const primaryProjectId = uniqueProjectIds.length > 0 ? uniqueProjectIds[0] : null;

  useWebSocket({
    projectId: primaryProjectId,
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      console.error("WebSocket error:", error);
    },
    onConnect: () => {
      console.log(`Connected to WebSocket for project ${primaryProjectId}`);
    },
    onDisconnect: () => {
      console.log(`Disconnected from WebSocket for project ${primaryProjectId}`);
    },
  });

  const updateIssueStatus = useCallback(
    async (issueId: string, newStatus: IssueStatus) => {
      const issue = issues.find((i) => i.id === issueId);
      if (!issue || !issue.apiId) {
        console.error("Issue not found or missing apiId:", issueId, issue);
        return false;
      }

      // Store original state for rollback
      const originalIssues = [...issues];

      // Optimistically update the UI
      const updatedIssues = issues.map((i) =>
        i.id === issueId ? { ...i, status: newStatus } : i
      );
      setIssues(updatedIssues);

      try {
        await issueApi.update(issue.apiId, { status: newStatus });
        // Don't show success toast here - WebSocket will handle the update notification
        // toast.success("Issue status updated successfully");
        return true;
      } catch (error: any) {
        // Revert the optimistic update on failure
        setIssues(originalIssues);
        
        // Show detailed error message
        const errorMessage = 
          error?.response?.data?.message || 
          error?.message || 
          "Failed to update issue status";
        
        console.error("Error updating issue status:", error);
        toast.error(errorMessage);
        return false;
      }
    },
    [issues]
  );

  const deleteIssue = useCallback(
    async (apiId: number) => {
      try {
        await issueApi.remove(apiId);
        toast.success("Issue deleted successfully");
        // Refresh data to get the latest state from the backend
        await loadData();
        return true;
      } catch (error) {
        const apiError = error as ApiError;
        toast.error(apiError.message || "Failed to delete issue");
        return false;
      }
    },
    [loadData]
  );

  return {
    issues,
    projects,
    isLoading,
    loadData,
    updateIssueStatus,
    deleteIssue,
  };
};
