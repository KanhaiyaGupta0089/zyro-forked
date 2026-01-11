import { useState, useEffect, useCallback, useMemo } from "react";
import { sprintApi } from "@/services/api/sprintApi";
import { Sprint, CreateSprintRequest, UpdateSprintRequest, Project } from "@/services/api/types";
import { toast } from "react-hot-toast";

/* ======================================================
   🔹 HOOK INTERFACE
====================================================== */

interface UseSprintsOptions {
  projectId?: number;
  autoFetch?: boolean;
}

interface UseSprintsReturn {
  sprints: Sprint[];
  loading: boolean;
  error: string | null;
  fetchSprints: () => Promise<void>;
  createSprint: (data: CreateSprintRequest) => Promise<Sprint | null>;
  updateSprint: (id: number, data: UpdateSprintRequest) => Promise<Sprint | null>;
  deleteSprint: (id: number) => Promise<boolean>;
  filteredSprints: Sprint[];
}

/* ======================================================
   🔹 HOOK IMPLEMENTATION
====================================================== */

export const useSprints = (
  options: UseSprintsOptions = {}
): UseSprintsReturn => {
  const { projectId, autoFetch = true } = options;

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchSprints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sprintApi.getAll();
      setSprints(data || []);
    } catch (err: any) {
      console.error("Error fetching sprints:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to fetch sprints";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchSprints();
    }
  }, [autoFetch, fetchSprints]);

  const createSprint = useCallback(
    async (data: CreateSprintRequest): Promise<Sprint | null> => {
      try {
        const newSprint = await sprintApi.create(data);
        setSprints((prev) => [...prev, newSprint]);
        toast.success("Sprint created successfully");
        return newSprint;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || "Failed to create sprint";
        toast.error(errorMessage);
        return null;
      }
    },
    []
  );

  const updateSprint = useCallback(
    async (id: number, data: UpdateSprintRequest): Promise<Sprint | null> => {
      try {
        const updated = await sprintApi.update(id, data);
        setSprints((prev) =>
          prev.map((s) => (s.id === id ? updated : s))
        );
        toast.success("Sprint updated successfully");
        return updated;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || "Failed to update sprint";
        toast.error(errorMessage);
        return null;
      }
    },
    []
  );

  const deleteSprint = useCallback(async (id: number): Promise<boolean> => {
    try {
      const success = await sprintApi.delete(id);
      if (success) {
        setSprints((prev) => prev.filter((s) => s.id !== id));
        toast.success("Sprint deleted successfully");
      }
      return success;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to delete sprint";
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const filteredSprints = useMemo(() => {
    if (!projectId) return sprints;
    return sprints.filter((s) => s.project_id === projectId);
  }, [sprints, projectId]);

  return {
    sprints: filteredSprints,
    loading,
    error,
    fetchSprints,
    createSprint,
    updateSprint,
    deleteSprint,
    filteredSprints,
  };
};

