import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { X, Save, Paperclip, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  issueApi,
  CreateIssueRequest,
  UpdateIssueRequest,
  IssueType,
  IssueStatus,
} from "@/services/api/issueApi";
import { Project } from "@/services/api/types";
import { ApiError } from "@/types/api";
import { RootState } from "@/redux/store";
import { UIIssue } from "../hooks/useIssues";
import { priorityMap } from "../constants/issueConfig";
import { FileUploadZone } from "./FileUploadZone";

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue?: UIIssue | null;
  projects: Project[];
  onSave: () => void;
}

export const IssueModal = ({
  isOpen,
  onClose,
  issue,
  projects,
  onSave,
}: IssueModalProps) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "task" as IssueType,
    status: "todo" as IssueStatus,
    priority: "medium" as "low" | "medium" | "high" | "critical",
    storyPoints: 0,
    projectId: 0,
    sprintId: 0,
    assignedTo: 0,
  });

  const [sprints, setSprints] = useState<Array<{ id: number; name: string; project_id: number }>>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    if (issue) {
      const projectId = typeof issue.project.id === 'string' 
        ? parseInt(issue.project.id, 10) 
        : (issue.project.id as number);
      const assignedToId = typeof issue.assignee.id === 'string' 
        ? parseInt(issue.assignee.id, 10) 
        : (issue.assignee.id as number);
      
      setFormData({
        name: issue.title,
        description: "",
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        storyPoints: issue.storyPoints || 0,
        projectId: projectId || 0,
        sprintId: 0,
        assignedTo: assignedToId || 0,
      });
    } else {
      const defaultProjectId = projects[0]?.id 
        ? (typeof projects[0].id === 'string' ? parseInt(projects[0].id, 10) : projects[0].id)
        : 0;
      
      setFormData({
        name: "",
        description: "",
        type: "task",
        status: "todo",
        priority: "medium",
        storyPoints: 0,
        projectId: defaultProjectId,
        sprintId: 0,
        assignedTo: 0,
      });
    }
  }, [issue, projects]);

  useEffect(() => {
    if (formData.projectId > 0) {
      // TODO: Fetch sprints for the selected project
      setSprints([]);
    } else {
      setSprints([]);
    }
  }, [formData.projectId]);

  useEffect(() => {
    // TODO: Fetch project team members for assignee selection
    setUsers([]);
  }, [formData.projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Issue name is required");
      return;
    }

    if (!issue && (!formData.projectId || formData.projectId === 0)) {
      toast.error("Please select a project");
      return;
    }

    try {
      setIsSubmitting(true);
      const backendPriority = priorityMap[formData.priority] || "moderate";

      if (issue?.apiId) {
        // Edit mode
        const updateData: UpdateIssueRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          status: formData.status,
          priority: backendPriority,
          story_point: formData.storyPoints,
          assigned_to: formData.assignedTo > 0 ? formData.assignedTo : null,
        };

        await issueApi.update(issue.apiId, updateData);
        toast.success("Issue updated successfully");
      } else {
        // Create mode
        const createData: CreateIssueRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          status: formData.status,
          priority: backendPriority,
          story_point: formData.storyPoints,
          project_id: formData.projectId,
          sprint_id: formData.sprintId > 0 ? formData.sprintId : null,
          assigned_to: formData.assignedTo > 0 ? formData.assignedTo : null,
        };

        await issueApi.create(createData);
        toast.success("Issue created successfully");
      }

      onSave();
      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || "Failed to save issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#DFE1E6] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#172B4D]">
            {issue ? "Edit Issue" : "Create Issue"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F4F5F7] rounded text-[#6B778C]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#172B4D] mb-1">
                Title / Summary <span className="text-[#DE350B]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-[#DFE1E6] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
                placeholder="Enter issue title"
                required
              />
            </div>

            {/* Basic Info Row - Type, Priority, Story Points */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#172B4D] mb-1">
                  Type <span className="text-[#DE350B]">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as IssueType })
                  }
                  className="w-full px-2 py-1.5 border border-[#DFE1E6] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
                  required
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="story">Story</option>
                  <option value="epic">Epic</option>
                  <option value="feature">Feature</option>
                  <option value="subtask">Subtask</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#172B4D] mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as "low" | "medium" | "high" | "critical",
                    })
                  }
                  className="w-full px-2 py-1.5 border border-[#DFE1E6] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#172B4D] mb-1">
                  Story Points
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.storyPoints}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      storyPoints: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2 py-1.5 border border-[#DFE1E6] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Project and Assignee Row (Create Mode Only) */}
            {!issue && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#172B4D] mb-1">
                    Project <span className="text-red-500">*</span>
                  </label>
                  {projects.length > 0 ? (
                    <select
                      value={formData.projectId || ""}
                      onChange={(e) => {
                        const projectId = parseInt(e.target.value);
                        setFormData({
                          ...formData,
                          projectId,
                          sprintId: 0,
                        });
                      }}
                      required
                      className="w-full px-2 py-1.5 border border-[#DFE1E6] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
                    >
                      <option value="">Select</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-2 py-1.5 border border-[#DFE1E6] rounded text-sm text-[#6B778C] bg-[#F4F5F7]">
                      No projects
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#172B4D] mb-1">
                    Assignee
                  </label>
                  <select
                    value={formData.assignedTo || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignedTo: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1.5 border border-[#DFE1E6] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Sprint (Create Mode Only) */}
            {!issue && formData.projectId > 0 && (
              <div>
                <label className="block text-sm font-medium text-[#172B4D] mb-1">
                  Sprint
                </label>
                <select
                  value={formData.sprintId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sprintId: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2 py-1.5 border border-[#DFE1E6] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
                >
                  <option value="">No Sprint</option>
                  {sprints.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status (Edit Mode Only) */}
            {issue && (
              <div>
                <label className="block text-sm font-medium text-[#172B4D] mb-1">
                  Status <span className="text-[#DE350B]">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as IssueStatus,
                    })
                  }
                  className="w-full px-2 py-1.5 border border-[#DFE1E6] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
                  required
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="qa">QA</option>
                  <option value="completed">Completed</option>
                  <option value="hold">Hold</option>
                  <option value="blocked">Blocked</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {/* Advanced Options Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-xs font-medium text-[#0052CC] hover:text-[#0065FF] transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </button>
            </div>

            {/* Advanced Options (Collapsible) */}
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2 border-t border-[#DFE1E6] mt-2"
              >
                {/* Reporter (Create Mode Only) */}
                {!issue && (
                  <div>
                    <label className="block text-sm font-medium text-[#172B4D] mb-1">
                      Reporter
                    </label>
                    <input
                      type="text"
                      value={currentUser?.name || "Current User"}
                      disabled
                      className="w-full px-2 py-1.5 border border-[#DFE1E6] rounded text-sm bg-[#F4F5F7] text-[#6B778C] cursor-not-allowed"
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#172B4D] mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-[#DFE1E6] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
                    placeholder="Enter issue description"
                    rows={3}
                  />
                </div>
              </motion.div>
            )}

            {/* Attachments Section */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAttachments(!showAttachments)}
                className="flex items-center gap-1 text-xs font-medium text-[#0052CC] hover:text-[#0065FF] transition-colors"
              >
                {showAttachments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showAttachments ? 'Hide' : 'Show'} Attachments ({pendingFiles.length})
              </button>

              {showAttachments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-2 border-t border-[#DFE1E6] mt-2"
                >
                  {/* Upload Zone */}
                  <FileUploadZone
                    onFileSelect={(file) => {
                      setPendingFiles((prev) => [...prev, file]);
                      toast.success(`${file.name} added`);
                    }}
                    isUploading={false}
                  />

                  {/* Files List */}
                  {pendingFiles.length > 0 && (
                    <div>
                      <div className="space-y-1">
                        {pendingFiles.map((file, index) => (
                          <motion.div
                            key={`${file.name}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between gap-2 p-2 bg-[#F4F5F7] rounded text-xs group"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Paperclip className="w-3 h-3 text-[#0052CC]" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[#172B4D] truncate">
                                  {file.name}
                                </p>
                                <p className="text-[#6B778C]">
                                  {(file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setPendingFiles((prev) =>
                                  prev.filter((_, i) => i !== index)
                                );
                                toast.success("File removed");
                              }}
                              className="flex-shrink-0 p-1 hover:bg-[#FFECEB] rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3 text-[#DE350B]" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#DFE1E6]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-[#42526E] hover:bg-[#F4F5F7] rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm font-medium bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : issue ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
