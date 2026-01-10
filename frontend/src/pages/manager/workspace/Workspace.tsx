import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/redux/store";
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  MoreVertical,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  User,
  MessageSquare,
  FileText,
  Activity,
  ListChecks,
  GitBranch,
} from "lucide-react";
import { dashboardApi } from "@/services/api/dashboardApi";
import { issueApi } from "@/services/api/issueApi";
import { projectApi } from "@/services/api/projectApi";
import { toast } from "react-hot-toast";
import { IssueStatus, IssuePriority, Issue as ApiIssue } from "@/services/api/types";
import { statuses, priorities, types } from "@/pages/manager/issue/constants/issueConfig";

interface WorkspaceStats {
  myIssues: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

interface QuickIssue {
  id: string;
  apiId: number;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  project: string;
  assignee?: string;
  dueDate?: string;
  type: string;
  description?: string;
  subIssues?: QuickIssue[];
  expanded?: boolean;
}

interface ActivityLog {
  id: string;
  issueId: string;
  issueTitle: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
  hours?: number;
}

const Workspace = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | "all">("all");
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  // Data states
  const [stats, setStats] = useState<WorkspaceStats>({
    myIssues: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });
  const [myIssues, setMyIssues] = useState<QuickIssue[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  // Log editing state
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    issueId: "",
    issueTitle: "",
    action: "work_logged",
    description: "",
    hours: 0,
  });

  // Fetch sub-issues for an issue
  const fetchSubIssues = async (issueId: number): Promise<QuickIssue[]> => {
    try {
      const subIssues = await issueApi.getSubIssues(issueId);
      return subIssues.map((subIssue: ApiIssue) => {
        const projectKey = subIssue.project?.name
          ? subIssue.project.name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 3)
          : "PROJ";
        return {
          id: `${projectKey}-${subIssue.id}`,
          apiId: subIssue.id,
          title: subIssue.name,
          status: subIssue.status,
          priority: subIssue.priority,
          project: subIssue.project?.name || `Project ${subIssue.project_id}`,
          assignee: subIssue.assignee?.name,
          type: subIssue.type,
        };
      });
    } catch (error) {
      console.error("Error fetching sub-issues:", error);
      return [];
    }
  };

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data
        const dashboardData = await dashboardApi.getDashboardData();

        // Fetch all issues to filter "my issues"
        const allIssues = await issueApi.getAll();
        const currentUserId = user?.id;

        // Filter my issues - handle both string and number IDs
        const currentUserIdNum = typeof currentUserId === 'string' ? parseInt(currentUserId) : currentUserId;
        
        const myIssuesData = await Promise.all(
          allIssues
            .filter((issue: any) => {
              if (!currentUserId) return false;
              const issueAssigneeId = issue.assigned_to || issue.assignee?.id;
              return (
                issueAssigneeId === currentUserId ||
                issueAssigneeId === currentUserIdNum ||
                String(issueAssigneeId) === String(currentUserId)
              );
            })
            .slice(0, 20)
            .map(async (issue: any) => {
              const projectKey = issue.project?.name
                ? issue.project.name
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 3)
                : "PROJ";

              const baseIssue: QuickIssue = {
                id: `${projectKey}-${issue.id}`,
                apiId: issue.id,
                title: issue.name,
                status: issue.status,
                priority: issue.priority,
                project: issue.project?.name || `Project ${issue.project_id}`,
                assignee: issue.assignee?.name,
                type: issue.type,
                description: issue.description,
                subIssues: [],
                expanded: false,
              };

              // Fetch sub-issues if this is a parent issue
              if (issue.type === "epic" || issue.type === "story") {
                const subIssues = await fetchSubIssues(issue.id);
                baseIssue.subIssues = subIssues;
              }

              return baseIssue;
            })
        );

        // Calculate stats
        const myIssuesStats = {
          myIssues: myIssuesData.length,
          inProgress: myIssuesData.filter((i) => i.status === "in_progress").length,
          completed: myIssuesData.filter((i) => i.status === "completed").length,
          overdue: 0,
        };

        // Load activity logs from localStorage (since no backend endpoint)
        const savedLogs = localStorage.getItem("workspace_activity_logs");
        const logs: ActivityLog[] = savedLogs ? JSON.parse(savedLogs) : [];

        setStats(myIssuesStats);
        setMyIssues(myIssuesData);
        setRecentProjects(dashboardData.recent_projects || []);
        setActivityLogs(logs);
      } catch (err: any) {
        console.error("Error fetching workspace data:", err);
        const errorMessage = err?.response?.data?.message || err?.message || "Failed to load workspace data";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user]);

  // Toggle issue expansion
  const toggleIssueExpansion = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  // Filter issues
  const filteredIssues = useMemo(() => {
    return myIssues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.project.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [myIssues, searchQuery, statusFilter, priorityFilter]);

  // Activity Log CRUD operations
  const handleCreateLog = () => {
    if (!logForm.issueId || !logForm.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      issueId: logForm.issueId,
      issueTitle: logForm.issueTitle,
      action: logForm.action,
      description: logForm.description,
      user: user?.name || "Unknown",
      timestamp: new Date().toISOString(),
      hours: logForm.hours || 0,
    };

    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    localStorage.setItem("workspace_activity_logs", JSON.stringify(updatedLogs));
    toast.success("Activity log created");
    setShowLogModal(false);
    setLogForm({
      issueId: "",
      issueTitle: "",
      action: "work_logged",
      description: "",
      hours: 0,
    });
  };

  const handleEditLog = (log: ActivityLog) => {
    setEditingLog(log);
    setLogForm({
      issueId: log.issueId,
      issueTitle: log.issueTitle,
      action: log.action,
      description: log.description,
      hours: log.hours || 0,
    });
    setShowLogModal(true);
  };

  const handleUpdateLog = () => {
    if (!editingLog || !logForm.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const updatedLogs = activityLogs.map((log) =>
      log.id === editingLog.id
        ? {
            ...log,
            action: logForm.action,
            description: logForm.description,
            hours: logForm.hours || 0,
          }
        : log
    );

    setActivityLogs(updatedLogs);
    localStorage.setItem("workspace_activity_logs", JSON.stringify(updatedLogs));
    toast.success("Activity log updated");
    setShowLogModal(false);
    setEditingLog(null);
    setLogForm({
      issueId: "",
      issueTitle: "",
      action: "work_logged",
      description: "",
      hours: 0,
    });
  };

  const handleDeleteLog = (logId: string) => {
    if (window.confirm("Are you sure you want to delete this activity log?")) {
      const updatedLogs = activityLogs.filter((log) => log.id !== logId);
      setActivityLogs(updatedLogs);
      localStorage.setItem("workspace_activity_logs", JSON.stringify(updatedLogs));
      toast.success("Activity log deleted");
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F4F5F7]">
        <AlertCircle className="w-16 h-16 text-[#DE350B] mb-4" />
        <h2 className="text-xl font-semibold text-[#172B4D] mb-2">Failed to Load Data</h2>
        <p className="text-[#6B778C] mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#0052CC] text-white rounded-lg hover:bg-[#0065FF] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Jira-style Header */}
      <div className="bg-white border-b border-[#DFE1E6] sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-[#172B4D]">Your work</h1>
              <div className="flex items-center gap-2 text-sm text-[#6B778C]">
                <span>Projects</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLogForm({
                    issueId: "",
                    issueTitle: "",
                    action: "work_logged",
                    description: "",
                    hours: 0,
                  });
                  setEditingLog(null);
                  setShowLogModal(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Log work
              </button>
              <button
                onClick={() => navigate("/issues")}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-4">
        {/* Stats Row - Jira Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded border border-[#DFE1E6] p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setStatusFilter("all")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B778C] mb-1 uppercase tracking-wide">Assigned to me</p>
                <p className="text-2xl font-semibold text-[#172B4D]">{stats.myIssues}</p>
              </div>
              <div className="w-10 h-10 rounded bg-[#DEEBFF] flex items-center justify-center">
                <User className="w-5 h-5 text-[#0052CC]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded border border-[#DFE1E6] p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setStatusFilter("in_progress")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B778C] mb-1 uppercase tracking-wide">In progress</p>
                <p className="text-2xl font-semibold text-[#172B4D]">{stats.inProgress}</p>
              </div>
              <div className="w-10 h-10 rounded bg-[#FFF4E6] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#974F00]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded border border-[#DFE1E6] p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setStatusFilter("completed")}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B778C] mb-1 uppercase tracking-wide">Done</p>
                <p className="text-2xl font-semibold text-[#172B4D]">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 rounded bg-[#E3FCEF] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#006644]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded border border-[#DFE1E6] p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B778C] mb-1 uppercase tracking-wide">Overdue</p>
                <p className="text-2xl font-semibold text-[#172B4D]">{stats.overdue}</p>
              </div>
              <div className="w-10 h-10 rounded bg-[#FFEBE6] flex items-center justify-center">
                <XCircle className="w-5 h-5 text-[#DE350B]" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content - Jira Style Issue List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded border border-[#DFE1E6]">
              {/* Search and Filters */}
              <div className="p-3 border-b border-[#DFE1E6] bg-[#F4F5F7]">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-[#6B778C] w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-[#DFE1E6] rounded text-sm bg-white focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC]"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as IssueStatus | "all")}
                    className="px-3 py-1.5 border border-[#DFE1E6] rounded text-sm bg-white focus:ring-2 focus:ring-[#0052CC]"
                  >
                    <option value="all">All statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Done</option>
                    <option value="qa">QA</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as IssuePriority | "all")}
                    className="px-3 py-1.5 border border-[#DFE1E6] rounded text-sm bg-white focus:ring-2 focus:ring-[#0052CC]"
                  >
                    <option value="all">All priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Issues List - Jira Style */}
              <div className="divide-y divide-[#DFE1E6]">
                {filteredIssues.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-[#C1C7D0] mx-auto mb-3" />
                    <p className="text-sm text-[#6B778C]">No issues found</p>
                  </div>
                ) : (
                  filteredIssues.map((issue, index) => {
                    const statusConfig = statuses[issue.status] || statuses.todo;
                    const priorityConfig = priorities[issue.priority] || priorities.medium;
                    const typeConfig = types[issue.type as keyof typeof types] || types.task;
                    const TypeIcon = typeConfig.icon;
                    const isExpanded = expandedIssues.has(issue.id);
                    const hasSubIssues = issue.subIssues && issue.subIssues.length > 0;

                    return (
                      <div key={issue.id}>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-start gap-3 p-3 hover:bg-[#F4F5F7] transition-colors group"
                        >
                          {/* Expand/Collapse for issues with sub-issues */}
                          {hasSubIssues ? (
                            <button
                              onClick={() => toggleIssueExpansion(issue.id)}
                              className="mt-0.5 text-[#6B778C] hover:text-[#172B4D] transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <div className="w-4" />
                          )}

                          {/* Issue Type Icon */}
                          <TypeIcon
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{ color: typeConfig.color }}
                          />

                          {/* Issue Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate("/issues");
                                }}
                                className="text-sm font-medium text-[#0052CC] hover:underline"
                              >
                                {issue.id}
                              </a>
                              <span className="text-sm text-[#172B4D]">{issue.title}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: statusConfig.bgColor,
                                  color: statusConfig.color,
                                }}
                              >
                                <statusConfig.icon className="w-3 h-3" />
                                {statusConfig.label}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: priorityConfig.bgColor,
                                  color: priorityConfig.color,
                                }}
                              >
                                {priorityConfig.label}
                              </span>
                              {issue.assignee && (
                                <div className="flex items-center gap-1 text-xs text-[#6B778C]">
                                  <User className="w-3 h-3" />
                                  {issue.assignee}
                                </div>
                              )}
                              <span className="text-xs text-[#6B778C]">{issue.project}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLogForm({
                                  issueId: issue.id,
                                  issueTitle: issue.title,
                                  action: "work_logged",
                                  description: "",
                                  hours: 0,
                                });
                                setEditingLog(null);
                                setShowLogModal(true);
                              }}
                              className="p-1 hover:bg-[#DFE1E6] rounded text-[#6B778C]"
                              title="Log work"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="p-1 hover:bg-[#DFE1E6] rounded text-[#6B778C]"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>

                        {/* Sub-issues */}
                        {isExpanded && hasSubIssues && (
                          <div className="bg-[#FAFBFC] border-l-2 border-[#DFE1E6] ml-7">
                            {issue.subIssues?.map((subIssue, subIndex) => {
                              const subStatusConfig = statuses[subIssue.status] || statuses.todo;
                              const subTypeConfig = types[subIssue.type as keyof typeof types] || types.task;
                              const SubTypeIcon = subTypeConfig.icon;

                              return (
                                <motion.div
                                  key={subIssue.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: subIndex * 0.05 }}
                                  className="flex items-start gap-3 p-3 pl-8 hover:bg-[#F4F5F7] transition-colors group border-b border-[#DFE1E6] last:border-b-0"
                                >
                                  <GitBranch className="w-3 h-3 text-[#6B778C] mt-1 flex-shrink-0" />
                                  <SubTypeIcon
                                    className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                                    style={{ color: subTypeConfig.color }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <a
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          navigate("/issues");
                                        }}
                                        className="text-xs font-medium text-[#0052CC] hover:underline"
                                      >
                                        {subIssue.id}
                                      </a>
                                      <span className="text-xs text-[#172B4D]">{subIssue.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                                        style={{
                                          backgroundColor: subStatusConfig.bgColor,
                                          color: subStatusConfig.color,
                                        }}
                                      >
                                        <subStatusConfig.icon className="w-2.5 h-2.5" />
                                        {subStatusConfig.label}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Activity Log */}
            <div className="bg-white rounded border border-[#DFE1E6]">
              <div className="p-3 border-b border-[#DFE1E6] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#172B4D] flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Activity
                </h3>
                <button
                  onClick={() => {
                    setLogForm({
                      issueId: "",
                      issueTitle: "",
                      action: "work_logged",
                      description: "",
                      hours: 0,
                    });
                    setEditingLog(null);
                    setShowLogModal(true);
                  }}
                  className="text-xs text-[#0052CC] hover:text-[#0065FF] font-medium"
                >
                  + Add
                </button>
              </div>
              <div className="p-3 max-h-[600px] overflow-y-auto">
                {activityLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-[#C1C7D0] mx-auto mb-2" />
                    <p className="text-xs text-[#6B778C]">No activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded border border-[#DFE1E6] hover:bg-[#F4F5F7] transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-[#0052CC]">
                                {log.issueId}
                              </span>
                              <span className="text-xs text-[#172B4D] truncate">
                                {log.issueTitle}
                              </span>
                            </div>
                            <p className="text-xs text-[#6B778C] mb-1">{log.description}</p>
                            <div className="flex items-center gap-2 text-xs text-[#6B778C]">
                              <User className="w-3 h-3" />
                              <span>{log.user}</span>
                              {log.hours && log.hours > 0 && (
                                <>
                                  <span>•</span>
                                  <Clock className="w-3 h-3" />
                                  <span>{log.hours}h</span>
                                </>
                              )}
                              <span>•</span>
                              <span>
                                {new Date(log.timestamp).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
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
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-white rounded border border-[#DFE1E6]">
              <div className="p-3 border-b border-[#DFE1E6]">
                <h3 className="text-sm font-semibold text-[#172B4D]">Recent projects</h3>
              </div>
              <div className="p-3 space-y-2">
                {recentProjects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-[#F4F5F7] cursor-pointer transition-colors"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded bg-[#0052CC] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#172B4D] truncate">
                          {project.name}
                        </p>
                        <p className="text-xs text-[#6B778C]">
                          {project.task_completed}/{project.total_task}
                        </p>
                      </div>
                    </div>
                    <div className="w-12 bg-[#F4F5F7] rounded-full h-1.5">
                      <div
                        className="bg-[#0052CC] h-1.5 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

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
                    issueId: "",
                    issueTitle: "",
                    action: "work_logged",
                    description: "",
                    hours: 0,
                  });
                }}
                className="p-1 hover:bg-[#F4F5F7] rounded"
              >
                <X className="w-5 h-5 text-[#6B778C]" />
              </button>
            </div>

            <div className="space-y-4">
              {!editingLog && (
                <div>
                  <label className="block text-sm font-medium text-[#172B4D] mb-1">
                    Issue
                  </label>
                  <select
                    value={logForm.issueId}
                    onChange={(e) => {
                      const selectedIssue = myIssues.find((i) => i.id === e.target.value);
                      setLogForm({
                        ...logForm,
                        issueId: e.target.value,
                        issueTitle: selectedIssue?.title || "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC]"
                  >
                    <option value="">Select an issue</option>
                    {myIssues.map((issue) => (
                      <option key={issue.id} value={issue.id}>
                        {issue.id} - {issue.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#172B4D] mb-1">
                  Action
                </label>
                <select
                  value={logForm.action}
                  onChange={(e) => setLogForm({ ...logForm, action: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC]"
                >
                  <option value="work_logged">Work Logged</option>
                  <option value="comment">Comment</option>
                  <option value="status_changed">Status Changed</option>
                  <option value="assigned">Assigned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#172B4D] mb-1">
                  Description
                </label>
                <textarea
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  placeholder="Enter description..."
                  rows={3}
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
                      issueId: "",
                      issueTitle: "",
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

export default Workspace;
