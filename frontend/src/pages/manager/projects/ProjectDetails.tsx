import { useState, useEffect } from "react";
import {
  useParams,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Kanban,
  Users,
  Calendar as CalendarIcon,
  BarChart3,
  Settings,
  Folder,
  Clock,
  ArrowLeft,
  User,
} from "lucide-react";

// Tab components
import OverviewTab from "@/pages/manager/projects/tabs/OverviewTab";
import IssuesTab from "@/pages/manager/projects/tabs/IssuesTab";
import KanbanTab from "@/pages/manager/projects/tabs/KanbanTab";
import TeamTab from "@/pages/manager/projects/tabs/TeamTab";
import TimelineTab from "@/pages/manager/projects/tabs/TimelineTab";
import AnalyticsTab from "@/pages/manager/projects/tabs/AnalyticsTab";
import SettingsTab from "@/pages/manager/projects/tabs/SettingsTab";

import { projectApi } from "@/services/api/projectApi";
import { issueApi } from "@/services/api/issueApi";
import { Project } from "@/services/api/types";
import { getStatusColor } from "@/utils/projectStatus";

/* ======================================================
   HELPERS
====================================================== */

const getProjectKey = (projectName: string): string => {
  const words = projectName.trim().split(/\s+/);

  const key =
    words.length === 1
      ? words[0].slice(0, 2)
      : words.map((w) => w[0]).join("");

  return key.slice(0, 3).toUpperCase(); // max 3 chars
};

const getProjectIdBadge = (projectName: string, id: number | string) =>
  `${getProjectKey(projectName)}-${id}`;


/* ======================================================
   CONFIG
====================================================== */

const PROJECT_TABS = [
  { path: "overview", label: "Overview", icon: Activity },
  { path: "issues", label: "Issues", icon: AlertCircle },
  { path: "kanban", label: "Kanban", icon: Kanban },
  { path: "team", label: "Team", icon: Users },
  { path: "timeline", label: "Timeline", icon: CalendarIcon },
  { path: "analytics", label: "Analytics", icon: BarChart3 },
  { path: "settings", label: "Settings", icon: Settings },
];

/* ======================================================
   DATA HOOK
====================================================== */

const useProjectDetails = (id?: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    progress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const projectRes = await projectApi.getProjectById(Number(id));
        const issues = await issueApi.getByProject(Number(id));

        const projectIssues = issues.filter(
          (i: any) => i.project_id === Number(id)
        );

        const completed = projectIssues.filter(
          (i: any) => i.status === "completed"
        ).length;

        const total = projectIssues.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        setProject(projectRes);
        setStats({ total, completed, progress });
      } catch (err) {
        console.error("Failed to load project", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  return { project, stats, loading };
};

/* ======================================================
   MAIN COMPONENT
====================================================== */

const ProjectDetails = () => {
  const { id } = useParams();
  const { project, stats, loading } = useProjectDetails(id);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      location.pathname === `/projects/${id}` ||
      location.pathname === `/projects/${id}/`
    ) {
      navigate(`/projects/${id}/overview`, { replace: true });
    }
  }, [location.pathname, id, navigate]);

  const renderTab = () => {
    if (location.pathname.endsWith("/overview")) return <OverviewTab />;
    if (location.pathname.endsWith("/issues")) return <IssuesTab />;
    if (location.pathname.endsWith("/kanban")) return <KanbanTab />;
    if (location.pathname.endsWith("/team")) return <TeamTab />;
    if (location.pathname.endsWith("/timeline")) return <TimelineTab />;
    if (location.pathname.endsWith("/analytics")) return <AnalyticsTab />;
    if (location.pathname.endsWith("/settings")) return <SettingsTab />;

    // fallback
    return <OverviewTab />;
  };

  if (loading) return <ProjectSkeleton />;
  if (!project) return null;

  return (
    <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* ================= HEADER ================= */}
      <header className="max-w-[1600px] mx-auto px-6 pt-6 pb-5 relative">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-gray-100/40 to-transparent -z-10" />

        {/* Back button */}
        <button
          onClick={() => navigate("/projects")}
          className="group flex items-center gap-3 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-5 transition"
        >
          <span
            className="
        flex items-center justify-center
        w-9 h-9
        rounded-full
        bg-gradient-to-br from-white to-gray-100
        border border-gray-300/50
        shadow-sm
        group-hover:scale-105
        focus-visible:ring-2 focus-visible:ring-gray-400
        transition-all duration-300
      "
          >
            <ArrowLeft size={16} className="text-gray-700" />
          </span>
          Back to Projects
        </button>

        {/* Main row */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between">
          {/* LEFT */}
          <div className="flex-1">
            <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-semibold bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent tracking-tight leading-tight">
              {project.name}
            </h1>

            <p className="mt-2.5 text-gray-600 max-w-3xl">
              {project.description || "No description provided."}
            </p>
          </div>

          {/* RIGHT – SUMMARY CARD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="
        bg-white/95 backdrop-blur
        border border-gray-300/60
        rounded-2xl
        shadow-[0_14px_32px_-14px_rgba(0,0,0,0.18)]
        px-4 py-4
        w-full lg:w-[340px]
        relative overflow-hidden
      "
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/60 to-gray-100/30 -z-10" />

            {/* Progress */}
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Progress
              </span>
              <span className="text-sm font-bold text-gray-900">
                {stats.progress}%
              </span>
            </div>

            <div className="h-1.5 bg-gray-200/80 rounded-full overflow-hidden shadow-inner mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-gray-700 to-gray-900"
              />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px] text-gray-700">
              <div className="flex items-center gap-2">
                <Folder size={15} className="text-gray-600 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-gray-500 font-medium">ID</span>
                  <span className="font-semibold truncate">
                    {getProjectIdBadge(project.name, project.id)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User size={15} className="text-gray-600 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-gray-500 font-medium">Owner</span>
                  <span className="font-semibold truncate">
                    {project.created_by || "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CalendarIcon size={15} className="text-gray-600 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-gray-500 font-medium">Start Date</span>
                  <span className="font-semibold truncate">
                    {new Date(project.start_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Activity size={15} className="text-gray-600 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] text-gray-500 font-medium">Issues</span>
                  <span className="font-semibold truncate">
                    {stats.completed}/{stats.total} Completed
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <nav className="mt-6 flex gap-2 bg-white p-2 rounded-xl shadow-sm overflow-x-auto">
          {PROJECT_TABS.map((tab) => {
            const active = location.pathname.includes(tab.path);
            return (
              <Link
                key={tab.path}
                to={`/projects/${id}/${tab.path}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition
            ${active
                    ? "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>


      {/* ================= CONTENT ================= */}
      <main className="max-w-[1600px] mx-auto px-6 py-6 flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="
        bg-white/95 backdrop-blur
        rounded-2xl
        border border-gray-300/70
        shadow-[0_12px_30px_-10px_rgba(0,0,0,0.08)]
        p-6
        min-h-[70vh]
        overflow-y-auto
      "
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

/* ======================================================
   SMALL HELPERS
====================================================== */

const Meta = ({ icon: Icon, label }: any) => (
  <div className="flex items-center gap-2 text-gray-600">
    <Icon size={14} className="text-gray-600" />
    <span className="truncate">{label}</span>
  </div>
);

const ProjectSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center text-gray-400">
    Loading project…
  </div>
);

export default ProjectDetails;
