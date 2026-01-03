import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Folder,
  Users,
  Calendar,
  Activity,
  TrendingUp,
} from "lucide-react";

import { projectApi } from "@/services/api/projectApi";
import { issueApi } from "@/services/api/issueApi";

const OverviewTab = () => {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===========================
      DATA FETCH
  ============================ */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const [projectRes, issueRes] = await Promise.all([
          projectApi.getProjectById(+id),
          issueApi.getByProject(+id)
        ]);

        setProject(projectRes);
        setIssues(issueRes || []);
      } catch (err) {
        console.error("Overview load failed", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* ===========================
      DERIVED METRICS (MANAGER VIEW)
  ============================ */
  const metrics = useMemo(() => {
    const total = issues.length;
    const completed = issues.filter(i =>
      ["completed", "closed"].includes(i.status?.toLowerCase())
    ).length;

    const blocked = issues.filter(i =>
      ["blocked", "critical"].includes(i.priority?.toLowerCase())
    ).length;

    const pending = total - completed;
    const progress = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, blocked, progress };
  }, [issues]);

  const statusColor =
    metrics.progress >= 80
      ? "bg-green-500"
      : metrics.progress >= 50
      ? "bg-yellow-500"
      : "bg-red-500";

  /* ===========================
      LOADER
  ============================ */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
        <p className="mt-4 text-gray-500">Preparing project overview…</p>
      </div>
    );
  }

  /* ===========================
      UI
  ============================ */
  return (
    <div className="space-y-6">
      {/* ==================================================
          HEADER SUMMARY (Always visible)
      ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 border shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-800">
            {project?.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {project?.description || "No description provided."}
          </p>

          {/* Progress */}
          <div className="mt-5">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Overall Progress</span>
              <span>{metrics.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full ${statusColor}`}
                style={{ width: `${metrics.progress}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Health Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border shadow-sm"
        >
          <h3 className="font-semibold text-gray-700 mb-4">
            Project Health
          </h3>

          <div className="space-y-3 text-sm">
            <HealthRow label="Schedule" value="On Track" color="green" />
            <HealthRow
              label="Issues Risk"
              value={metrics.blocked > 0 ? "Attention Needed" : "Low"}
              color={metrics.blocked > 0 ? "red" : "green"}
            />
            <HealthRow label="Delivery" value={`${metrics.progress}%`} />
          </div>
        </motion.div>
      </div>

      {/* ==================================================
          KEY METRICS
      ================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat icon={Folder} label="Total Issues" value={metrics.total} />
        <Stat
          icon={Activity}
          label="Completed"
          value={metrics.completed}
          color="green"
        />
        <Stat
          icon={Activity}
          label="Pending"
          value={metrics.pending}
          color="yellow"
        />
        <Stat
          icon={Activity}
          label="Blocked"
          value={metrics.blocked}
          color="red"
        />
      </div>

      {/* ==================================================
          METADATA
      ================================================== */}
      <div className="bg-white rounded-2xl p-6 border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Project Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <Meta icon={Calendar} label="Start" value={formatDate(project?.start_date)} />
          <Meta icon={Calendar} label="End" value={formatDate(project?.end_date)} />
          <Meta icon={Users} label="Owner" value={project?.created_by || "—"} />
          <Meta icon={Activity} label="Status" value={project?.status || "Active"} />
        </div>
      </div>

      {/* ==================================================
          MANAGER INSIGHTS
      ================================================== */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Manager Insights
        </h3>

        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>
            {metrics.blocked > 0
              ? "Critical issues detected — review Issues tab."
              : "No major blockers identified."}
          </li>
          <li>
            Completion rate is <strong>{metrics.progress}%</strong>.
          </li>
          <li>
            {metrics.progress < 50
              ? "Project needs closer monitoring."
              : "Project delivery is stable."}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default OverviewTab;

/* ===========================
   REUSABLE COMPONENTS
=========================== */

const Stat = ({ icon: Icon, label, value, color = "indigo" }: any) => (
  <div className="bg-white rounded-xl p-4 border shadow-sm">
    <div className={`p-2 rounded-lg bg-${color}-100 w-fit mb-2`}>
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const Meta = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-3">
    <Icon className="w-5 h-5 text-gray-400" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

const HealthRow = ({ label, value, color = "gray" }: any) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span className={`text-${color}-600 font-medium`}>{value}</span>
  </div>
);

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString() : "—";
