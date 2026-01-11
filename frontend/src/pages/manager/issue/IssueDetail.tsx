import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Plus,
  Save,
  X,
  User,
  Calendar,
  GitBranch,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Link as LinkIcon,
  Activity,
  Paperclip,
  Share2,
  Download,
} from "lucide-react";
import { issueApi } from "@/services/api/issueApi";
import { logsApi, Log } from "@/services/api/logsApi";
import { toast } from "react-hot-toast";
import { IssueStatus, IssuePriority, Issue as ApiIssue } from "@/services/api/types";
import { statuses, priorities, types } from "./constants/issueConfig";
import { RootState } from "@/redux/store";
import { useAttachments } from "./hooks/useAttachments";
import { AttachmentsList } from "./components/AttachmentsList";
import { FileUploadZone } from "./components/FileUploadZone";
import { Attachment } from "@/services/api/attachmentApi";

interface ActivityLog {
  id: number;
  issueId: number;
  description: string;
  user: string;
  timestamp: string;
  hours: number;
  date: string;
}

interface SubIssue {
  id: string;
  apiId: number;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: string;
  assignee?: string;
}

const IssueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issue, setIssue] = useState<ApiIssue | null>(null);
  const [subIssues, setSubIssues] = useState<SubIssue[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [expandedSubIssues, setExpandedSubIssues] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  
  // Editing states
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [logForm, setLogForm] = useState({
    description: "",
    hours: 0,
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
  });

  // Attachments hook
  const {
    attachments,
    loading: attachmentsLoading,
    isUploading,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
    loadAttachments,
  } = useAttachments({
    issueId: issue?.id,
    autoLoad: true,
  });

  // Fetch issue details
  useEffect(() => {
    const fetchIssue = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);

        // Extract numeric ID from format like "PROJ-24"
        const numericId = parseInt(id.split("-").pop() || id);
        
        const issueData = await issueApi.getById(numericId);
        setIssue(issueData);
        setEditedDescription(issueData.description || "");

        // Fetch sub-issues
        try {
          const subIssuesData = await issueApi.getSubIssues(numericId);
          const formattedSubIssues: SubIssue[] = subIssuesData.map((sub: ApiIssue) => {
            const projectKey = sub.project?.name
              ? sub.project.name
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 3)
              : "PROJ";
            return {
              id: `${projectKey}-${sub.id}`,
              apiId: sub.id,
              title: sub.name,
              status: sub.status,
              priority: sub.priority,
              type: sub.type,
              assignee: sub.assignee?.name,
            };
          });
          setSubIssues(formattedSubIssues);
        } catch (err) {
          console.error("Error fetching sub-issues:", err);
          setSubIssues([]);
        }

        // Fetch activity logs from backend
        try {
          const issueLogsData = await issueApi.getLogsByIssue(numericId);
          // Transform logs to ActivityLog format
          const issueLogs: ActivityLog[] = issueLogsData.map((log: any) => ({
            id: log.id,
            issueId: log.issue_id,
            description: log.description || "",
            user: user?.name || "Unknown",
            timestamp: log.created_at,
            hours: Number(log.hour_worked) || 0,
            date: log.date,
          }));
          setActivityLogs(issueLogs);
        } catch (err) {
          console.error("Error fetching logs:", err);
          setActivityLogs([]);
        }
      } catch (err: any) {
        console.error("Error fetching issue:", err);
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to load issue";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id]);

  // Save description
  const handleSaveDescription = async () => {
    if (!issue) return;

    try {
      await issueApi.update(issue.id, { description: editedDescription });
      setIssue({ ...issue, description: editedDescription });
      setIsEditingDescription(false);
      toast.success("Description updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update description");
    }
  };

  // Activity Log CRUD
  const handleCreateLog = async () => {
    if (!logForm.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (!issue || !user?.id) return;

    try {
      const newLog = await logsApi.create({
        issue_id: issue.id,
        description: logForm.description,
        date: logForm.date,
        hour_worked: logForm.hours || 0,
      });

      const activityLog: ActivityLog = {
        id: newLog.id,
        issueId: newLog.issue_id,
        description: newLog.description || "",
        user: user.name || "Unknown",
        timestamp: newLog.created_at,
        hours: Number(newLog.hour_worked) || 0,
        date: newLog.date,
      };

      setActivityLogs([activityLog, ...activityLogs]);
      toast.success("Activity log created");
      setShowLogModal(false);
      setLogForm({
        description: "",
        hours: 0,
        date: new Date().toISOString().split("T")[0],
      });
    } catch (err: any) {
      console.error("Error creating log:", err);
      toast.error(err?.response?.data?.message || "Failed to create log");
    }
  };

  const handleEditLog = (log: ActivityLog) => {
    setEditingLog(log);
    setLogForm({
      description: log.description,
      hours: log.hours || 0,
      date: log.date,
    });
    setShowLogModal(true);
  };

  const handleUpdateLog = async () => {
    if (!editingLog || !logForm.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const updatedLog = await logsApi.update(editingLog.id, {
        description: logForm.description,
        date: logForm.date,
        hour_worked: logForm.hours || 0,
      });

      const activityLog: ActivityLog = {
        id: updatedLog.id,
        issueId: updatedLog.issue_id,
        description: updatedLog.description || "",
        user: user?.name || "Unknown",
        timestamp: updatedLog.updated_at,
        hours: Number(updatedLog.hour_worked) || 0,
        date: updatedLog.date,
      };

      setActivityLogs(
        activityLogs.map((log) => (log.id === editingLog.id ? activityLog : log))
      );
      toast.success("Activity log updated");
      setShowLogModal(false);
      setEditingLog(null);
      setLogForm({
        description: "",
        hours: 0,
        date: new Date().toISOString().split("T")[0],
      });
    } catch (err: any) {
      console.error("Error updating log:", err);
      toast.error(err?.response?.data?.message || "Failed to update log");
    }
  };

  const handleDeleteLog = async (logId: number) => {
    if (!window.confirm("Are you sure you want to delete this activity log?")) {
      return;
    }

    try {
      await logsApi.delete(logId);
      setActivityLogs(activityLogs.filter((log) => log.id !== logId));
      toast.success("Activity log deleted");
    } catch (err: any) {
      console.error("Error deleting log:", err);
      toast.error(err?.response?.data?.message || "Failed to delete log");
    }
  };

  // Attachment handlers
  const handleViewAttachment = (attachment: Attachment) => {
    setViewingAttachment(attachment);
  };

  const handleShareAttachment = async (attachment: Attachment) => {
    try {
      const url = attachment.file_url;
      if (navigator.share) {
        await navigator.share({
          title: attachment.file_name,
          url: url,
        });
        toast.success("Shared successfully");
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(attachment.file_url);
          toast.success("Link copied to clipboard");
        } catch (clipboardErr) {
          toast.error("Failed to share attachment");
        }
      }
    }
  };

  // Update status
  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue) return;

    try {
      await issueApi.update(issue.id, { status: newStatus });
      setIssue({ ...issue, status: newStatus });
      toast.success("Status updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F5F7]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#0052CC] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F4F5F7]">
        <AlertCircle className="w-16 h-16 text-[#DE350B] mb-4" />
        <h2 className="text-xl font-semibold text-[#172B4D] mb-2">Issue Not Found</h2>
        <p className="text-[#6B778C] mb-4">{error || "The issue you're looking for doesn't exist"}</p>
        <button
          onClick={() => navigate("/issues")}
          className="px-4 py-2 bg-[#0052CC] text-white rounded-lg hover:bg-[#0065FF] transition-colors"
        >
          Back to Issues
        </button>
      </div>
    );
  }

  const statusConfig = statuses[issue.status] || statuses.todo;
  const priorityConfig = priorities[issue.priority] || priorities.medium;
  const typeConfig = types[issue.type as keyof typeof types] || types.task;
  const TypeIcon = typeConfig.icon;

  const projectKey = issue.project?.name
    ? issue.project.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 3)
    : "PROJ";
  const issueKey = `${projectKey}-${issue.id}`;

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Header - Jira Style */}
      <div className="bg-white border-b border-[#DFE1E6] sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/issues")}
                className="p-1.5 hover:bg-[#F4F5F7] rounded transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#6B778C]" />
              </button>
              <div className="flex items-center gap-2">
                <TypeIcon className="w-5 h-5" style={{ color: typeConfig.color }} />
                <h1 className="text-xl font-semibold text-[#172B4D]">{issueKey}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLogForm({
                    description: "",
                    hours: 0,
                    date: new Date().toISOString().split("T")[0],
                  });
                  setEditingLog(null);
                  setShowLogModal(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors text-sm font-medium"
              >
                <Clock className="w-4 h-4" />
                Log work
              </button>
              <button className="p-1.5 hover:bg-[#F4F5F7] rounded transition-colors">
                <MoreVertical className="w-5 h-5 text-[#6B778C]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Issue Title and Status */}
            <div className="bg-white rounded border border-[#DFE1E6] p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-semibold text-[#172B4D] flex-1">
                  {issue.name}
                </h2>
                <select
                  value={issue.status}
                  onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                  className="px-3 py-1.5 border border-[#DFE1E6] rounded text-sm font-medium focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC]"
                  style={{
                    backgroundColor: statusConfig.bgColor,
                    color: statusConfig.color,
                  }}
                >
                  {Object.keys(statuses).map((status) => (
                    <option key={status} value={status}>
                      {statuses[status as IssueStatus].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue Meta */}
              <div className="flex items-center gap-4 flex-wrap text-sm text-[#6B778C] mb-4">
                <div className="flex items-center gap-1.5">
                  <TypeIcon className="w-4 h-4" style={{ color: typeConfig.color }} />
                  <span className="font-medium">{typeConfig.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: priorityConfig.bgColor,
                      color: priorityConfig.color,
                    }}
                  >
                    {priorityConfig.label}
                  </span>
                </div>
                {issue.assignee && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>{issue.assignee.name || "Unassigned"}</span>
                  </div>
                )}
                {issue.created_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Created {new Date(issue.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded border border-[#DFE1E6] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[#172B4D]">Description</h3>
                {!isEditingDescription && (
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="text-sm text-[#0052CC] hover:text-[#0065FF] font-medium flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
              {isEditingDescription ? (
                <div className="space-y-3">
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows={6}
                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveDescription}
                      className="px-3 py-1.5 bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingDescription(false);
                        setEditedDescription(issue.description || "");
                      }}
                      className="px-3 py-1.5 bg-white border border-[#DFE1E6] text-[#172B4D] rounded hover:bg-[#F4F5F7] transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[#172B4D] whitespace-pre-wrap">
                  {issue.description || (
                    <span className="text-[#6B778C] italic">No description provided</span>
                  )}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white rounded border border-[#DFE1E6] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAttachments(!showAttachments)}
                    className="text-[#6B778C] hover:text-[#172B4D]"
                  >
                    {showAttachments ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <Paperclip className="w-5 h-5 text-[#6B778C]" />
                  <h3 className="text-base font-semibold text-[#172B4D]">
                    Attachments ({attachments.length})
                  </h3>
                </div>
              </div>
              {showAttachments && (
                <div className="space-y-4">
                  {/* Upload Zone */}
                  <FileUploadZone
                    onFileSelect={async (file) => {
                      try {
                        await uploadAttachment(file);
                        await loadAttachments();
                      } catch (error) {
                        // Error already handled in hook
                      }
                    }}
                    isUploading={isUploading}
                  />

                  {/* Attachments List */}
                  <AttachmentsList
                    attachments={attachments}
                    onView={handleViewAttachment}
                    onShare={handleShareAttachment}
                    onDownload={downloadAttachment}
                    onDelete={async (attachmentId) => {
                      try {
                        await deleteAttachment(attachmentId);
                        await loadAttachments();
                      } catch (error) {
                        // Error already handled in hook
                      }
                    }}
                    isLoading={attachmentsLoading}
                  />
                </div>
              )}
            </div>

            {/* Sub-issues */}
            {subIssues.length > 0 && (
              <div className="bg-white rounded border border-[#DFE1E6] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedSubIssues(!expandedSubIssues)}
                      className="text-[#6B778C] hover:text-[#172B4D]"
                    >
                      {expandedSubIssues ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <GitBranch className="w-5 h-5 text-[#6B778C]" />
                    <h3 className="text-base font-semibold text-[#172B4D]">
                      Sub-issues ({subIssues.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate("/issues")}
                    className="text-sm text-[#0052CC] hover:text-[#0065FF] font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add sub-issue
                  </button>
                </div>
                {expandedSubIssues && (
                  <div className="space-y-2">
                    {subIssues.map((subIssue) => {
                      const subStatusConfig = statuses[subIssue.status] || statuses.todo;
                      const subTypeConfig = types[subIssue.type as keyof typeof types] || types.task;
                      const SubTypeIcon = subTypeConfig.icon;

                      return (
                        <motion.div
                          key={subIssue.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded border border-[#DFE1E6] hover:bg-[#F4F5F7] transition-colors cursor-pointer group"
                          onClick={() => navigate(`/issues/${subIssue.id}`)}
                        >
                          <SubTypeIcon
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: subTypeConfig.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/issues/${subIssue.id}`);
                                }}
                                className="text-sm font-medium text-[#0052CC] hover:underline"
                              >
                                {subIssue.id}
                              </a>
                              <span className="text-sm text-[#172B4D]">{subIssue.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: subStatusConfig.bgColor,
                                  color: subStatusConfig.color,
                                }}
                              >
                                <subStatusConfig.icon className="w-3 h-3" />
                                {subStatusConfig.label}
                              </span>
                              {subIssue.assignee && (
                                <div className="flex items-center gap-1 text-xs text-[#6B778C]">
                                  <User className="w-3 h-3" />
                                  {subIssue.assignee}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#DFE1E6] rounded transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4 text-[#6B778C]" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Activity Log */}
            <div className="bg-white rounded border border-[#DFE1E6] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[#172B4D] flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity
                </h3>
                <button
                  onClick={() => {
                    setLogForm({
                      description: "",
                      hours: 0,
                      date: new Date().toISOString().split("T")[0],
                    });
                    setEditingLog(null);
                    setShowLogModal(true);
                  }}
                  className="text-sm text-[#0052CC] hover:text-[#0065FF] font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-3">
                {activityLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-[#C1C7D0] mx-auto mb-2" />
                    <p className="text-sm text-[#6B778C]">No activity yet</p>
                  </div>
                ) : (
                  activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded border border-[#DFE1E6] hover:bg-[#F4F5F7] transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {log.hours && log.hours > 0 && (
                              <span className="text-xs text-[#6B778C] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {log.hours}h
                              </span>
                            )}
                            {log.date && (
                              <span className="text-xs text-[#6B778C] flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(log.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#172B4D] mb-2">{log.description}</p>
                          <div className="flex items-center gap-2 text-xs text-[#6B778C]">
                            <User className="w-3 h-3" />
                            <span>{log.user}</span>
                            <span>•</span>
                            <span>
                              {new Date(log.timestamp).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditLog(log)}
                            className="p-1 hover:bg-[#DFE1E6] rounded text-[#6B778C]"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 hover:bg-[#FFEBE6] rounded text-[#DE350B]"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Details Panel */}
            <div className="bg-white rounded border border-[#DFE1E6] p-4">
              <h3 className="text-sm font-semibold text-[#172B4D] mb-4">Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#6B778C] uppercase tracking-wide mb-1 block">
                    Status
                  </label>
                  <select
                    value={issue.status}
                    onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm font-medium focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC]"
                    style={{
                      backgroundColor: statusConfig.bgColor,
                      color: statusConfig.color,
                    }}
                  >
                    {Object.keys(statuses).map((status) => (
                      <option key={status} value={status}>
                        {statuses[status as IssueStatus].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#6B778C] uppercase tracking-wide mb-1 block">
                    Priority
                  </label>
                  <div
                    className="w-full px-3 py-2 rounded text-sm font-medium"
                    style={{
                      backgroundColor: priorityConfig.bgColor,
                      color: priorityConfig.color,
                    }}
                  >
                    {priorityConfig.label}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#6B778C] uppercase tracking-wide mb-1 block">
                    Assignee
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 border border-[#DFE1E6] rounded text-sm bg-white">
                    {issue.assignee ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-xs font-semibold">
                          {issue.assignee.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="text-[#172B4D]">{issue.assignee.name}</span>
                      </>
                    ) : (
                      <span className="text-[#6B778C]">Unassigned</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#6B778C] uppercase tracking-wide mb-1 block">
                    Reporter
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 border border-[#DFE1E6] rounded text-sm bg-white">
                    {issue.reporter ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-xs font-semibold">
                          {issue.reporter.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="text-[#172B4D]">{issue.reporter.name}</span>
                      </>
                    ) : (
                      <span className="text-[#6B778C]">Unknown</span>
                    )}
                  </div>
                </div>

                {issue.project && (
                  <div>
                    <label className="text-xs font-medium text-[#6B778C] uppercase tracking-wide mb-1 block">
                      Project
                    </label>
                    <button
                      onClick={() => navigate(`/projects/${issue.project_id}`)}
                      className="w-full text-left px-3 py-2 border border-[#DFE1E6] rounded text-sm bg-white hover:bg-[#F4F5F7] transition-colors text-[#0052CC] hover:underline"
                    >
                      {issue.project.name}
                    </button>
                  </div>
                )}

                {issue.created_at && (
                  <div>
                    <label className="text-xs font-medium text-[#6B778C] uppercase tracking-wide mb-1 block">
                      Created
                    </label>
                    <div className="px-3 py-2 border border-[#DFE1E6] rounded text-sm bg-white text-[#172B4D]">
                      {new Date(issue.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                )}

                {issue.updated_at && (
                  <div>
                    <label className="text-xs font-medium text-[#6B778C] uppercase tracking-wide mb-1 block">
                      Updated
                    </label>
                    <div className="px-3 py-2 border border-[#DFE1E6] rounded text-sm bg-white text-[#172B4D]">
                      {new Date(issue.updated_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded border border-[#DFE1E6] p-4">
              <h3 className="text-sm font-semibold text-[#172B4D] mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] rounded transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy link
                </button>
                <button
                  onClick={() => navigate("/issues")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] rounded transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit issue
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Attachment View Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#DFE1E6]">
              <h3 className="text-lg font-semibold text-[#172B4D] truncate">
                {viewingAttachment.file_name}
              </h3>
              <button
                onClick={() => setViewingAttachment(null)}
                className="p-1 hover:bg-[#F4F5F7] rounded"
              >
                <X className="w-5 h-5 text-[#6B778C]" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {viewingAttachment.file_type.startsWith('image/') ? (
                <img
                  src={viewingAttachment.file_url}
                  alt={viewingAttachment.file_name}
                  className="max-w-full max-h-[70vh] mx-auto"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-[#C1C7D0] mb-4" />
                  <p className="text-sm text-[#6B778C] mb-4">
                    Preview not available for this file type
                  </p>
                  <a
                    href={viewingAttachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors text-sm font-medium"
                  >
                    Open in New Tab
                  </a>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-[#DFE1E6]">
              <button
                onClick={() => handleShareAttachment(viewingAttachment)}
                className="px-3 py-1.5 text-sm text-[#172B4D] hover:bg-[#F4F5F7] rounded transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => {
                  downloadAttachment(viewingAttachment.id, viewingAttachment.file_name);
                }}
                className="px-3 py-1.5 bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#172B4D]">
                {editingLog ? "Edit Activity Log" : "Log Work"}
              </h3>
              <button
                onClick={() => {
                  setShowLogModal(false);
                  setEditingLog(null);
                  setLogForm({
                    description: "",
                    hours: 0,
                    date: new Date().toISOString().split("T")[0],
                  });
                }}
                className="p-1 hover:bg-[#F4F5F7] rounded"
              >
                <X className="w-5 h-5 text-[#6B778C]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#172B4D] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={logForm.date}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#172B4D] mb-1">
                  Description
                </label>
                <textarea
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  placeholder="Enter description..."
                  rows={4}
                  className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#172B4D] mb-1">
                  Hours Worked
                </label>
                <input
                  type="number"
                  value={logForm.hours}
                  onChange={(e) =>
                    setLogForm({ ...logForm, hours: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={editingLog ? handleUpdateLog : handleCreateLog}
                  className="flex-1 px-4 py-2 bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingLog ? "Update" : "Create"}
                </button>
                <button
                  onClick={() => {
                    setShowLogModal(false);
                    setEditingLog(null);
                    setLogForm({
                      action: "work_logged",
                      description: "",
                      hours: 0,
                    });
                  }}
                  className="px-4 py-2 bg-white border border-[#DFE1E6] text-[#172B4D] rounded hover:bg-[#F4F5F7] transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default IssueDetail;

