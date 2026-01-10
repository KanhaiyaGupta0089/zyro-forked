import { memo } from "react";
import { Search, Plus, LayoutGrid, List, Filter } from "lucide-react";
import { SprintStatus, Project } from "@/services/api/types";

/* ======================================================
   🔹 INTERFACE
====================================================== */

interface SprintHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedProject: number | "all";
  onProjectChange: (projectId: number | "all") => void;
  selectedStatus: SprintStatus | "all";
  onStatusChange: (status: SprintStatus | "all") => void;
  viewMode: "board" | "list";
  onViewModeChange: (mode: "board" | "list") => void;
  onCreateClick: () => void;
  projects: Project[];
}

/* ======================================================
   🔹 COMPONENT
====================================================== */

export const SprintHeader = memo<SprintHeaderProps>(
  ({
    searchQuery,
    onSearchChange,
    selectedProject,
    onProjectChange,
    selectedStatus,
    onStatusChange,
    viewMode,
    onViewModeChange,
    onCreateClick,
    projects,
  }) => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sprints..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) =>
                onProjectChange(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) =>
                onStatusChange(e.target.value as SprintStatus | "all")
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewModeChange("board")}
              className={`
                p-2 rounded-lg transition-colors
                ${
                  viewMode === "board"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
              aria-label="Board view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`
                p-2 rounded-lg transition-colors
                ${
                  viewMode === "list"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Create Button */}
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Sprint
          </button>
        </div>
      </div>
    );
  }
);

SprintHeader.displayName = "SprintHeader";




