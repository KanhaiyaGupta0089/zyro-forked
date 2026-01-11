import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  Kanban,
  BarChart3,
  Edit2,
  Trash2,
} from "lucide-react";
import { sprintApi } from "@/services/api/sprintApi";
import { Sprint, Issue, UpdateSprintRequest } from "@/services/api/types";
import { useSprintAnalytics } from "./hooks/useSprintAnalytics";
import { getStatusConfig, formatDateRange, getDaysRemaining } from "./constants/sprintConfig";
import { SprintAnalytics } from "./components/SprintAnalytics";
import { SprintModal } from "./components/SprintModal";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

/* ======================================================
   🔹 TABS
====================================================== */

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "board", label: "Board", icon: Kanban },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

/* ======================================================
   🔹 MAIN COMPONENT
====================================================== */

const SprintDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);

  const analytics = useSprintAnalytics(sprint, allSprints);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const [sprintData, allSprintsData] = await Promise.all([
          sprintApi.getById(Number(id)),
          sprintApi.getAll(),
        ]);
        setSprint(sprintData);
        setAllSprints(allSprintsData);
      } catch (error) {
        console.error("Failed to fetch sprint:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Sprint not found</p>
        <button
          onClick={() => navigate("/manager/sprints")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Back to Sprints
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(sprint.status);
  const issues = sprint.issues || [];
  const totalIssues = issues.length;
  const completedIssues = issues.filter((i) => i.status === "completed").length;
  const daysRemaining = getDaysRemaining(sprint.end_date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/manager/sprints")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{sprint.name}</h1>
          <p className="text-gray-600 mt-1">{sprint.sprint_id}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${statusConfig.badgeColor}
            `}
          >
            {statusConfig.label}
          </span>
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            title="Edit Sprint"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={async () => {
              if (window.confirm(`Are you sure you want to delete "${sprint.name}"? This action cannot be undone.`)) {
                try {
                  await sprintApi.delete(sprint.id);
                  toast.success("Sprint deleted successfully");
                  navigate("/manager/sprints");
                } catch (error) {
                  toast.error("Failed to delete sprint");
                }
              }
            }}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-600"
            title="Delete Sprint"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedIssues}</p>
          <p className="text-xs text-gray-500 mt-1">of {totalIssues} issues</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {issues.filter((i) => i.status === "in_progress").length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Date Range</span>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {formatDateRange(sprint.start_date, sprint.end_date)}
          </p>
          {daysRemaining !== null && (
            <p className="text-xs text-gray-500 mt-1">
              {daysRemaining > 0
                ? `${daysRemaining} days left`
                : daysRemaining === 0
                ? "Ends today"
                : `${Math.abs(daysRemaining)} days overdue`}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Project</span>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {sprint.project?.name || `Project ${sprint.project_id}`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sprint Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <p className="font-medium text-gray-900">
                      {sprint.start_date
                        ? new Date(sprint.start_date).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">End Date</p>
                    <p className="font-medium text-gray-900">
                      {sprint.end_date
                        ? new Date(sprint.end_date).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <span
                      className={`
                        inline-block px-2 py-1 rounded-full text-xs font-medium
                        ${statusConfig.badgeColor}
                      `}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Issues</p>
                    <p className="font-medium text-gray-900">{totalIssues}</p>
                  </div>
                </div>
              </div>

              {issues.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Issues Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(
                      issues.reduce((acc, issue) => {
                        acc[issue.status] = (acc[issue.status] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([status, count]) => (
                      <div
                        key={status}
                        className="bg-gray-50 rounded-lg p-3 text-center"
                      >
                        <p className="text-2xl font-bold text-gray-900">
                          {count}
                        </p>
                        <p className="text-xs text-gray-600 capitalize mt-1">
                          {status.replace("_", " ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "board" && (
            <div>
              {issues.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No issues in this sprint</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {["todo", "in_progress", "qa", "completed"].map((status) => {
                      const statusIssues = issues.filter((i) => i.status === status);
                      return (
                        <div key={status} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-700 mb-3 capitalize">
                            {status.replace("_", " ")} ({statusIssues.length})
                          </h4>
                          <div className="space-y-2">
                            {statusIssues.map((issue) => (
                              <div
                                key={issue.id}
                                className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/manager/issues/${issue.id}`)}
                              >
                                <p className="font-medium text-sm text-gray-900">
                                  {issue.name}
                                </p>
                                {issue.assignee && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {issue.assignee.name}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <SprintAnalytics analytics={analytics} />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {sprint && (
        <SprintModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={async (data) => {
            try {
              const updated = await sprintApi.update(sprint.id, data as UpdateSprintRequest);
              setSprint(updated);
              setShowEditModal(false);
              toast.success("Sprint updated successfully");
              // Refresh data
              const [sprintData, allSprintsData] = await Promise.all([
                sprintApi.getById(Number(id)),
                sprintApi.getAll(),
              ]);
              setSprint(sprintData);
              setAllSprints(allSprintsData);
            } catch (error) {
              toast.error("Failed to update sprint");
            }
          }}
          sprint={sprint}
          projects={[]}
        />
      )}
    </div>
  );
};

export default SprintDetail;

