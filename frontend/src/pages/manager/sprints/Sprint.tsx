import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useSprints } from "./hooks/useSprints";
import { SprintHeader } from "./components/SprintHeader";
import { SprintBoard } from "./components/SprintBoard";
import { SprintList } from "./components/SprintList";
import { SprintModal } from "./components/SprintModal";
import { Sprint, SprintStatus, CreateSprintRequest, UpdateSprintRequest } from "@/services/api/types";
import { projectApi } from "@/services/api/projectApi";
import { Project } from "@/services/api/types";
import { toast } from "react-hot-toast";

/* ======================================================
   🔹 MAIN COMPONENT
====================================================== */

const SprintPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<SprintStatus | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const { sprints, loading, createSprint, updateSprint, deleteSprint, fetchSprints } = useSprints();

  // Fetch projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectApi.getProjects();
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };
    loadProjects();
  }, []);

  // Filter sprints
  const filteredSprints = useMemo(() => {
    return sprints.filter((sprint) => {
      const matchesSearch =
        searchQuery === "" ||
        sprint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sprint.sprint_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProject =
        selectedProject === "all" || sprint.project_id === selectedProject;

      const matchesStatus =
        selectedStatus === "all" || sprint.status === selectedStatus;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [sprints, searchQuery, selectedProject, selectedStatus]);

  // Handlers
  const handleSprintClick = useCallback(
    (sprint: Sprint) => {
      navigate(`/manager/sprints/${sprint.id}`);
    },
    [navigate]
  );

  const handleCreate = useCallback(async (data: CreateSprintRequest) => {
    await createSprint(data);
    await fetchSprints();
  }, [createSprint, fetchSprints]);

  const handleEdit = useCallback(
    async (data: UpdateSprintRequest) => {
      if (!editingSprint) return;
      await updateSprint(editingSprint.id, data);
      setEditingSprint(null);
      await fetchSprints();
    },
    [editingSprint, updateSprint, fetchSprints]
  );

  const handleDelete = useCallback(
    async (sprint: Sprint) => {
      if (
        !window.confirm(
          `Are you sure you want to delete "${sprint.name}"? This action cannot be undone.`
        )
      ) {
        return;
      }

      const success = await deleteSprint(sprint.id);
      if (success) {
        await fetchSprints();
      }
    },
    [deleteSprint, fetchSprints]
  );

  const handleModalSubmit = useCallback(
    async (data: CreateSprintRequest | UpdateSprintRequest) => {
      if (editingSprint) {
        await handleEdit(data as UpdateSprintRequest);
      } else {
        await handleCreate(data as CreateSprintRequest);
      }
    },
    [editingSprint, handleEdit, handleCreate]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading sprints...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sprints</h1>
        <p className="text-gray-600 mt-1">
          Manage and track your sprint progress
        </p>
      </div>

      {/* Filters and Actions */}
      <SprintHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateClick={() => {
          setEditingSprint(null);
          setShowCreateModal(true);
        }}
        projects={projects}
      />

      {/* Content */}
      {filteredSprints.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">
            {sprints.length === 0
              ? "No sprints found. Create your first sprint to get started!"
              : "No sprints match your filters."}
          </p>
          {sprints.length === 0 && (
            <button
              onClick={() => {
                setEditingSprint(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Create Sprint
            </button>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === "board" ? (
            <SprintBoard
              sprints={filteredSprints}
              onSprintClick={handleSprintClick}
              onEdit={(sprint) => {
                setEditingSprint(sprint);
                setShowCreateModal(true);
              }}
              onDelete={handleDelete}
            />
          ) : (
            <SprintList
              sprints={filteredSprints}
              onSprintClick={handleSprintClick}
              onEdit={(sprint) => {
                setEditingSprint(sprint);
                setShowCreateModal(true);
              }}
              onDelete={handleDelete}
            />
          )}
        </motion.div>
      )}

      {/* Modals */}
      <SprintModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingSprint(null);
        }}
        onSubmit={handleModalSubmit}
        sprint={editingSprint}
        projects={projects}
      />
    </div>
  );
};

export default SprintPage;

