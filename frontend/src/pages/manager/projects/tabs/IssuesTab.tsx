import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Loader2, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useIssues, UIIssue } from "@/pages/manager/issue/hooks/useIssues";
import { useIssueFilters } from "@/pages/manager/issue/hooks/useIssueFilters";
import { useIssueDragDrop } from "@/pages/manager/issue/hooks/useIssueDragDrop";
import { issueApi, IssueType, IssueStatus } from "@/services/api/issueApi";
import { projectService } from "@/services/api/projectApi";
import { Issue as ApiIssue, Project } from "@/services/api/types";
import { RootState } from "@/redux/store";

// UI + Components
import { IssueHeader } from "@/pages/manager/issue/components/IssueHeader";
import { IssueBoard } from "@/pages/manager/issue/components/IssueBoard";
import { IssueList } from "@/pages/manager/issue/components/IssueList";
import { IssueModal } from "@/pages/manager/issue/components/IssueModal";
import { DeleteConfirmModal } from "@/pages/manager/issue/components/DeleteConfirmModal";

/* ======================================================
   🔹 MAIN COMPONENT
====================================================== */

const IssuesTab = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);

  const [issues, setIssues] = useState<UIIssue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<UIIssue | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<UIIssue | null>(null);
  const [selectedView, setSelectedView] = useState<"board" | "list">("board");

  const {
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    filteredIssues,
    issuesByStatus,
  } = useIssueFilters(issues);

  // Filter issues by project ID
  const projectIssues = issues.filter(issue => issue.project.id === projectId);
  const projectFilteredIssues = filteredIssues.filter(issue => issue.project.id === projectId);
  const projectIssuesByStatus = Object.keys(issuesByStatus).reduce((acc, statusKey) => {
    acc[statusKey as keyof typeof issuesByStatus] = 
      issuesByStatus[statusKey as keyof typeof issuesByStatus].filter(issue => issue.project.id === projectId);
    return acc;
  }, {} as typeof issuesByStatus);

  // Drag and drop setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Status update function for project issues
  const updateIssueStatus = async (issueId: string, newStatus: any) => {
    const issue = projectIssues.find((i) => i.id === issueId);
    if (!issue || !issue.apiId) return false;
    
    // Get the old status for the toast message
    const oldIssue = issues.find((i) => i.id === issueId);
    const oldStatus = oldIssue ? oldIssue.status : 'unknown';

    // Optimistically update the UI
    const updatedIssues = issues.map((i) =>
      i.id === issueId ? { ...i, status: newStatus } : i
    );
    setIssues(updatedIssues);

    try {
      await issueApi.update(issue.apiId, { status: newStatus });
      toast.success(`Issue moved from ${oldStatus} to ${newStatus}`);
      return true;
    } catch (error) {
      // Revert the optimistic update on failure
      setIssues(issues);
      toast.error("Failed to update issue status");
      return false;
    }
  };

  const deleteIssue = async (apiId: number) => {
    try {
      // Find the issue to get its title for the toast
      const issue = issues.find(i => i.apiId === apiId);
      const issueTitle = issue ? issue.title : 'Unknown Issue';
      
      await issueApi.remove(apiId);
      // Refresh data to get the latest state from the backend
      loadProjectData();
      toast.success(`Issue deleted: ${issueTitle}`);
      return true;
    } catch (error) {
      toast.error("Failed to delete issue");
      return false;
    }
  };

  const { activeIssue, handleDragStart, handleDragEnd } = useIssueDragDrop(
    projectIssues,
    updateIssueStatus
  );

  // Enhanced drag handlers with toast notifications
  const handleDragStartWithToast = (event: any) => {
    handleDragStart(event);
    const issueId = event.active.id;
    const issue = projectIssues.find((i) => i.id === issueId);
    if (issue) {
      toast(`Moving issue: ${issue.title}`, { icon: '🔄' });
    }
  };

  const handleDragEndWithToast = async (event: any) => {
    const result = await handleDragEnd(event);
    // The toast for success/failure is already handled in updateIssueStatus
    return result;
  };

  // Load project data
  const loadProjectData = async () => {
    try {
      setIsLoading(true);

      // Load project issues for the specific project
      const projectIssuesData = await issueApi.getByProject(projectId);
      
      // Load the project details
      const projectDetails = await projectService.getProjectById(projectId);
      
      // Transform the issues to UI format
      const uiIssues = projectIssuesData.map((apiIssue) => {
        const projectKey = apiIssue.project?.name
          ? apiIssue.project.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 3)
          : `PROJ`;
        
        return {
          id: `${projectKey}-${apiIssue.id}`,
          apiId: apiIssue.id,
          title: apiIssue.name,
          type: apiIssue.type,
          priority: (apiIssue.priority === "moderate" ? "medium" : apiIssue.priority === "low" ? "low" : apiIssue.priority === "high" ? "high" : apiIssue.priority === "critical" ? "critical" : "medium") as "low" | "medium" | "high" | "critical",
          status: apiIssue.status,
          assignee: {
            name: apiIssue.assignee?.name || "Unassigned",
            avatar: apiIssue.assignee?.name
              ? apiIssue.assignee.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "U",
            id: apiIssue.assignee?.id,
          },
          reporter: {
            name: apiIssue.reporter?.name || "Unknown",
            avatar: apiIssue.reporter?.name
              ? apiIssue.reporter.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "U",
            id: apiIssue.reporter?.id,
          },
          project: {
            id: apiIssue.project_id,
            name: apiIssue.project?.name || `Project ${apiIssue.project_id}`,
            key: projectKey,
          },
          created: formatTimeAgo(apiIssue.created_at),
          updated: formatTimeAgo(apiIssue.updated_at),
          labels: [],
          storyPoints: apiIssue.story_point || 0,
        };
      });
      
      setIssues(uiIssues);
      setProjects(projectDetails ? [projectDetails] : []);
      toast.success("Project issues loaded successfully");
    } catch (error) {
      console.error("Error loading project issues:", error);
      toast.error("Failed to load project issues");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // Event handlers
  const handleEdit = (issue: UIIssue) => {
    setEditingIssue(issue);
  };

  const handleDelete = (issue: UIIssue) => {
    setDeletingIssue(issue);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingIssue?.apiId) return;
    const success = await deleteIssue(deletingIssue.apiId);
    if (success) {
      setDeletingIssue(null);
    }
  };

  // Format time ago helper
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

  // Filter projects for the current project
  const currentProject = projects.find(p => p.id === projectId) || null;

  /* ===============================
     LOADING
  =============================== */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ===============================
     UI
  =============================== */
  return (
    <>
      <style>{`
              .issue-column-scroll::-webkit-scrollbar {
                width: 2px;
              }

              .issue-column-scroll::-webkit-scrollbar-track {
                background: #F4F5F7;
              }

              .issue-column-scroll::-webkit-scrollbar-thumb {
                background: #C1C7D0;
                border-radius: 10px;
              }

              .issue-column-scroll::-webkit-scrollbar-thumb:hover {
                background: #A5ADBA;
              }
            `}
      </style>

      {/* ================= CONTENT WRAPPER (MATCH PROJECT PAGE) ================= */}
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="bg-white rounded-2xl border border-gray-300/70 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.08)] overflow-hidden">

          {/* ================= HEADER ================= */}
          <IssueHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            selectedView={selectedView}
            onViewChange={setSelectedView}
            onCreateClick={() => setShowCreateModal(true)}
          />

          {/* ================= CONTENT ================= */}
          <div className="p-4 bg-[#F4F5F7] min-h-[520px]">
            <AnimatePresence mode="wait">
              {selectedView === "board" ? (
                <IssueBoard
                  issuesByStatus={projectIssuesByStatus}
                  activeIssue={activeIssue}
                  sensors={sensors}
                  onDragStart={handleDragStartWithToast}
                  onDragEnd={handleDragEndWithToast}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ) : (
                <IssueList
                  issues={projectFilteredIssues}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      <IssueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        issue={null}
        projects={currentProject ? [currentProject] : []}
        onSave={loadProjectData}
      />

      <IssueModal
        isOpen={!!editingIssue}
        onClose={() => setEditingIssue(null)}
        issue={editingIssue || null}
        projects={currentProject ? [currentProject] : []}
        onSave={loadProjectData}
      />

      <DeleteConfirmModal
        isOpen={!!deletingIssue}
        onClose={() => setDeletingIssue(null)}
        issue={deletingIssue}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default IssuesTab;
