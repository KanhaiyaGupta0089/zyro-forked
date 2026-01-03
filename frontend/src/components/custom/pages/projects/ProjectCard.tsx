import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash,
} from "lucide-react";

import DeleteProjectModal from "@/components/custom/pages/projects/DeleteProjectModal";
import { projectApi } from "@/services/api/projectApi";
import { Project } from "@/services/api/types";
import { issueApi } from "@/services/api/issueApi";
import { getStatusColor, getStatusIcon } from "@/utils/projectStatus";
import ProjectBadge from "@/components/custom/ProjectBadge";

/* ======================================================
   Helpers
====================================================== */

const getProgressColor = (progress: number): string => {
  if (progress >= 100) return "bg-green-500";
  if (progress > 75) return "bg-blue-500";
  if (progress > 50) return "bg-sky-500";
  if (progress > 25) return "bg-amber-500";
  return "bg-red-500";
};

/* ======================================================
   Types
====================================================== */

interface ProjectCardProps {
  project: Project;
  refresh: () => void;
  onEdit?: (id: number) => void;
}

/* ======================================================
   Component
====================================================== */

const ProjectCard = ({ project, refresh, onEdit }: ProjectCardProps) => {
  const navigate = useNavigate();

  const [showDelete, setShowDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    progress: number;
  }>({
    total: 0,
    completed: 0,
    progress: 0,
  });

  /* -----------------------------
     Delete Project
  ----------------------------- */
  const handleDelete = async () => {
    try {
      await projectApi.deleteProject(Number(project.id));
      setShowDelete(false);
      setShowMenu(false);
      refresh();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  /* ======================================================
     FETCH ISSUES & CALCULATE PROJECT-WISE STATS
     (THIS IS THE IMPORTANT PART)
  ====================================================== */
  useEffect(() => {
    const fetchProjectIssues = async () => {
      try {
        // 🔹 Fetch ALL issues (single source of truth)
        const response = await issueApi.getAll();

        // 🔹 Filter issues for THIS project only
        const projectIssues = response.filter(
          (issue: any) => issue.project_id === Number(project.id)
        );

        const total = projectIssues.length;
        const completed = projectIssues.filter(
          (issue: any) => issue.status === "completed"
        ).length;

        const progress =
          total > 0 ? Math.round((completed / total) * 100) : 0;

        setStats({
          total,
          completed,
          progress,
        });
      } catch (error) {
        console.error("Failed to fetch project issues:", error);

        // Fallback to project.progress if API fails
        setStats({
          total: 0,
          completed: 0,
          progress: project.progress || 0,
        });
      }
    };

    fetchProjectIssues();
  }, [project.id, project.progress]);

  // ✅ SAFE PROGRESS (NO UI BREAK)
  const safeProgress = Math.min(100, Math.max(0, stats.progress));

  /* ======================================================
     Render
  ====================================================== */

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -3,
        boxShadow:
          "0 4px 12px -2px rgba(0,0,0,0.1), 0 4px 8px -2px rgba(0,0,0,0.04)",
      }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer relative"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      {/* Three-dot menu */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg py-1 w-32 z-20 min-w-max">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(Number(project.id));
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-150 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDelete(true);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
            >
              <Trash className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-start gap-2 mb-2 min-w-0">
          <ProjectBadge projectName={project.name} size="sm" />
          <h3 className="font-semibold text-gray-800 truncate flex-1">
            {project.name}
          </h3>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">
          {project.description || "No description provided"}
        </p>

        {/* =====================
            Progress Bar
        ===================== */}
        <div
          className="mb-3"
          title={`${stats.completed}/${stats.total} issues completed`}
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <motion.div
                role="progressbar"
                aria-valuenow={safeProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                initial={{ width: 0 }}
                animate={{ width: `${safeProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-1.5 rounded-full ${getProgressColor(
                  safeProgress
                )}`}
              />
            </div>
            <span className="text-xs text-gray-600 min-w-[32px] text-right">
              {safeProgress}%
            </span>
          </div>

          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>
              {stats.completed}/{stats.total} issues
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              project.status
            )}`}
          >
            {(getStatusIcon(project.status) === "Clock" ||
              project.status === "active" ||
              project.status === "inactive" ||
              project.status === "upcoming") && (
              <Clock className="w-3 h-3" />
            )}
            {getStatusIcon(project.status) === "CheckCircle" && (
              <CheckCircle className="w-3 h-3" />
            )}
            {getStatusIcon(project.status) === "AlertCircle" && (
              <AlertCircle className="w-3 h-3" />
            )}
            {project.status.charAt(0).toUpperCase() +
              project.status.slice(1)}
          </span>
        </div>

        {/* Dates */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Start: {project.start_date || "N/A"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>End: {project.end_date || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDelete && (
        <DeleteProjectModal
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </motion.div>
  );
};

export default ProjectCard;
