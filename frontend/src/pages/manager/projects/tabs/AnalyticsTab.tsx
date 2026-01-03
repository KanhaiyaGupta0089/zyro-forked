import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  TrendingUp,
  Activity,
} from "lucide-react";
import { projectApi } from "@/services/api/projectApi";
import { issueApi } from "@/services/api/issueApi";

/* ======================================================
   TYPES
====================================================== */

interface AnalyticsSummary {
  total: number;
  completed: number;
  inProgress: number;
  open: number;
  overdue: number;
  completionRate: number;
  avgIssuesPerMember: number;
  riskLevel: "Low" | "Medium" | "High";
  priority: {
    high: number;
    medium: number;
    low: number;
  };
}

/* ======================================================
   COMPONENT
====================================================== */

const AnalyticsTab = () => {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  /* ===============================
      FETCH & COMPUTE
  =============================== */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);

        const project = await projectApi.getProjectById(+id);
        const issues = await issueApi.getByProject(+id);

        const total = issues.length;

        const completed = issues.filter((i: any) =>
          ["completed", "closed"].includes(i.status?.toLowerCase())
        ).length;

        const inProgress = issues.filter((i: any) =>
          ["in progress", "in-progress"].includes(i.status?.toLowerCase())
        ).length;

        const open = issues.filter((i: any) =>
          ["open", "todo"].includes(i.status?.toLowerCase())
        ).length;

        const overdue = issues.filter((i: any) => {
          if (!i.due_date) return false;
          return (
            new Date(i.due_date) < new Date() &&
            !["completed", "closed"].includes(i.status?.toLowerCase())
          );
        }).length;

        const completionRate =
          total > 0 ? Math.round((completed / total) * 100) : 0;

        const teamSize = project.teamMembers || 1;

        const avgIssuesPerMember =
          teamSize > 0 ? Math.round(total / teamSize) : 0;

        const priority = {
          high: issues.filter((i: any) =>
            ["high", "critical"].includes(i.priority?.toLowerCase())
          ).length,
          medium: issues.filter((i: any) =>
            ["medium"].includes(i.priority?.toLowerCase())
          ).length,
          low: issues.filter((i: any) =>
            ["low"].includes(i.priority?.toLowerCase())
          ).length,
        };

        const riskLevel: AnalyticsSummary["riskLevel"] =
          overdue > 0 || priority.high > 3
            ? "High"
            : inProgress > open
            ? "Medium"
            : "Low";

        setSummary({
          total,
          completed,
          inProgress,
          open,
          overdue,
          completionRate,
          avgIssuesPerMember,
          riskLevel,
          priority,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* ===============================
      LOADING
  =============================== */
  if (loading) {
    return (
      <div className="flex justify-center py-20 text-gray-500">
        Loading analytics…
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center py-20 text-gray-500">
        <BarChart3 className="w-10 h-10 mb-3" />
        No analytics available
      </div>
    );
  }

  /* ===============================
      UI
  =============================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Project Analytics
        </h2>
        <p className="text-sm text-gray-500">
          Performance, workload & delivery risk
        </p>
      </div>

      {/* CORE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric
          icon={<Activity />}
          label="Total Issues"
          value={summary.total}
        />
        <Metric
          icon={<Activity />}
          label="Completed"
          value={summary.completed}
          color="green"
        />
        <Metric
          icon={<Activity />}
          label="In Progress"
          value={summary.inProgress}
          color="yellow"
        />
        <Metric
          icon={<Activity />}
          label="Overdue"
          value={summary.overdue}
          color="red"
        />
      </div>

      {/* COMPLETION */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold">Completion Rate</h3>
          <span className="font-bold text-indigo-600">
            {summary.completionRate}%
          </span>
        </div>

        <div className="w-full h-3 bg-gray-200 rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${summary.completionRate}%` }}
            className="h-3 bg-indigo-600 rounded-full"
          />
        </div>
      </div>

      {/* MANAGEMENT INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Insight title="Team Load">
          <Users className="w-4 h-4" />
          <span>
            Avg. {summary.avgIssuesPerMember} issues per member
          </span>
        </Insight>

        <Insight title="Delivery Risk">
          <TrendingUp className="w-4 h-4" />
          <span
            className={`font-semibold ${
              summary.riskLevel === "High"
                ? "text-red-600"
                : summary.riskLevel === "Medium"
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {summary.riskLevel}
          </span>
        </Insight>
      </div>

      {/* PRIORITY BREAKDOWN */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Priority Breakdown</h3>

        <div className="space-y-2 text-sm">
          <Row label="High / Critical" value={summary.priority.high} />
          <Row label="Medium" value={summary.priority.medium} />
          <Row label="Low" value={summary.priority.low} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;

/* ======================================================
   SMALL UI PARTS
====================================================== */

const Metric = ({ icon, label, value, color = "indigo" }: any) => (
  <div className="bg-white border rounded-xl p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded bg-${color}-100 text-${color}-600`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

const Insight = ({ title, children }: any) => (
  <div className="bg-white border rounded-xl p-4 shadow-sm">
    <p className="text-xs text-gray-500 mb-2">{title}</p>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);

const Row = ({ label, value }: any) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);
