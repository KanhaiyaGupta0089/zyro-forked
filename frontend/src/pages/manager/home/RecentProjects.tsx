import {
  Folder,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RecentProject } from "../../../services/api/types";
import ProjectBadge from "../../../components/custom/ProjectBadge";

/* ======================================================
   Helpers
====================================================== */

const getStatusPill = (status: string): string => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-blue-50 text-blue-700";
    case "completed":
      return "bg-green-50 text-green-700";
    case "delayed":
      return "bg-red-50 text-red-700";
    case "upcoming":
      return "bg-purple-50 text-purple-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
};

const getProgressColor = (progress: number): string => {
  if (progress >= 100) return "bg-green-500";
  if (progress > 75) return "bg-blue-500";
  if (progress > 50) return "bg-sky-500";
  if (progress > 25) return "bg-amber-500";
  return "bg-red-500";
};

/* ======================================================
   Project Item
====================================================== */

interface ProjectItemProps {
  project: RecentProject;
  onClick: () => void;
}

const ProjectItem = ({ project, onClick }: ProjectItemProps) => (
  <motion.li
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -3 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    onClick={onClick}
    className="
      group relative cursor-pointer
      bg-white/70 backdrop-blur-md
      border border-gray-200/60 rounded-xl p-3
      transition-all duration-200
      hover:border-blue-300 hover:shadow-md
    "
  >

    <div className="flex items-start gap-3">
      {/* Badge */}
      <ProjectBadge projectName={project.name} size="md" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-medium text-gray-900 truncate">
            {project.name}
          </h3>

          <ChevronRight
            size={16}
            className="text-gray-400 opacity-0 group-hover:opacity-100 transition"
          />
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mt-1.5 max-lg:text-xs">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusPill(
              project.status
            )}`}
          >
            {project.status}
          </span>
{/* 
          {project.team_members_details && Array.isArray(project.team_members_details) &&
          project.team_members_details.length > 0 ? (
            <span className="text-xs text-gray-500 truncate">
              {project.team_members_details
                .slice(0, 2)
                .map((m) => m.name)
                .join(", ")}
              {project.team_members_details.length > 2 && (
                <span className="ml-1">
                  +{project.team_members_details.length - 2}
                </span>
              )}
            </span>
          ) : (
            <span className="flex items-center text-xs text-gray-500">
              <User size={12} className="mr-1" />
              {project.team_members || 0}
            </span>
          )} */}

          <span className="text-xs text-gray-500">
            {project.task_completed || 0}/{project.total_task || 0} issues
          </span>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <motion.div
                role="progressbar"
                aria-valuenow={project.total_task && project.total_task > 0 ? Math.round((project.task_completed || 0) / project.total_task * 100) : 0}
                aria-valuemin={0}
                aria-valuemax={100}
                initial={{ width: 0 }}
                animate={{ width: `${project.total_task && project.total_task > 0 ? Math.round((project.task_completed || 0) / project.total_task * 100) : 0}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-1.5 rounded-full ${getProgressColor(
                  project.total_task && project.total_task > 0 ? Math.round((project.task_completed || 0) / project.total_task * 100) : 0
                )}`}
              />
            </div>
            <span className="text-xs text-gray-600 min-w-[32px] text-right">
              {project.total_task && project.total_task > 0 ? Math.round((project.task_completed || 0) / project.total_task * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </motion.li>
);

/* ======================================================
   Main Component
====================================================== */

interface RecentProjectsProps {
  projects?: RecentProject[];
  loading?: boolean;
  error?: string | null;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects = [],
  loading = false,
  error = null,
}) => {
  const navigate = useNavigate();
  const visibleProjects = projects.slice(0, 4);

  return (
    <div className="bg-white/70 backdrop-blur-md border border-gray-200/60 rounded-xl p-4 flex flex-col h-full">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Folder size={16} />
          </span>
          Recent Projects
        </h2>

        <button
          onClick={() => navigate("/projects")}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          View all
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {loading && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Loader2 size={20} className="animate-spin mb-2 text-blue-500" />
            <p className="text-sm">Loading projects…</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-40 text-red-500">
            <AlertCircle size={20} className="mb-2" />
            <p className="text-sm text-center">{error}</p>
          </div>
        )}

        {!loading && !error && visibleProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Folder size={20} className="mb-2 opacity-50" />
            <p className="text-sm">No recent projects</p>
          </div>
        )}

        {!loading && !error && visibleProjects.length > 0 && (
          <ul className="space-y-3">
            {visibleProjects.map((project, index) => (
              <ProjectItem
                key={project.id ?? `project-${index}`}
                project={project}
                onClick={() => navigate(`/projects/${project.id}/overview`)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecentProjects;
