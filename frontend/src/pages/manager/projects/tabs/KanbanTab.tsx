import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MoreVertical, Calendar, Loader2 } from "lucide-react";

import { issueApi, IssueStatus } from "@/services/api/issueApi";
import { Issue } from "@/services/api/types";
import { User as UserIcon } from "lucide-react";

/* ===============================
   STATUS NORMALIZATION
=============================== */
const STATUS_MAP: Record<string, IssueStatus> = {
  todo: "todo",
  open: "todo",
  "in progress": "in_progress",
  in_progress: "in_progress",
  qa: "qa",
  review: "qa",
  completed: "completed",
  closed: "completed",
};

/* ===============================
   KANBAN COLUMNS (VISIBLE ONLY)
=============================== */
const COLUMNS: {
  key: IssueStatus;
  title: string;
  bg: string;
}[] = [
  { key: "todo", title: "To Do", bg: "bg-gray-100" },
  { key: "in_progress", title: "In Progress", bg: "bg-yellow-100" },
  { key: "qa", title: "QA", bg: "bg-blue-100" },
  { key: "completed", title: "Done", bg: "bg-green-100" },
];

const KanbanTab = () => {
  const { id } = useParams<{ id: string }>();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  /* ===============================
      FETCH ISSUES
  =============================== */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const data = await issueApi.getByProject(+id);
        setIssues(data || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* ===============================
      DERIVED COLUMNS
  =============================== */
  const columns = useMemo(() => {
    const grouped: Record<IssueStatus, Issue[]> = {
      todo: [],
      in_progress: [],
      qa: [],
      completed: [],
      cancelled: [],
      hold: [],
      blocked: [],
    };

    issues.forEach((issue) => {
      const normalized =
        STATUS_MAP[issue.status?.toLowerCase()] ?? "todo";
      grouped[normalized].push(issue);
    });

    return grouped;
  }, [issues]);

  /* ===============================
      MOVE ISSUE (MANAGER ACTION)
  =============================== */
  const moveIssue = async (issueId: number, status: IssueStatus) => {
    try {
      setUpdatingId(issueId);
      await issueApi.update(issueId, { status });
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId ? { ...i, status } : i
        )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /* ===============================
      LOADING
  =============================== */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="mt-3 text-gray-500">Loading Kanban board…</p>
      </div>
    );
  }

  /* ===============================
      UI
  =============================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Task Flow (Kanban)
          </h2>
          <p className="text-sm text-gray-500">
            Visualize execution and delivery stages
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          Add Issue
        </button>
      </div>

      {/* BOARD */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="w-72 flex-shrink-0">
            <div
              className={`flex justify-between items-center mb-3 p-3 rounded-lg ${col.bg}`}
            >
              <h3 className="font-semibold text-gray-800">
                {col.title}
              </h3>
              <span className="text-xs px-2 py-1 rounded-full bg-white">
                {columns[col.key].length}
              </span>
            </div>

            <div className="space-y-3 min-h-[420px]">
              <AnimatePresence>
                {columns[col.key].map((issue) => (
                  <KanbanCard
                    key={issue.id}
                    issue={issue}
                    current={col.key}
                    updating={updatingId === issue.id}
                    onMove={moveIssue}
                  />
                ))}
              </AnimatePresence>

              {columns[col.key].length === 0 && (
                <div className="text-center text-sm text-gray-400 border border-dashed rounded-lg py-6">
                  No issues
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanTab;

/* ===============================
   CARD
=============================== */

const KanbanCard = ({
  issue,
  current,
  updating,
  onMove,
}: {
  issue: Issue;
  current: IssueStatus;
  updating: boolean;
  onMove: (id: number, status: IssueStatus) => void;
}) => {
  const next =
    current === "todo"
      ? "in_progress"
      : current === "in_progress"
      ? "qa"
      : current === "qa"
      ? "completed"
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md"
    >
      <div className="flex justify-between mb-1">
        <h4 className="font-medium text-sm truncate">
          {issue.name}
        </h4>
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </div>

      <p className="text-xs text-gray-600 line-clamp-2 mb-3">
        {issue.description}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <UserIcon className="w-3 h-3" />
          {issue.assignee?.name || "Unassigned"}
        </span>

        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(issue.created_at).toLocaleDateString()}
        </span>
      </div>

      {next && (
        <button
          disabled={updating}
          onClick={() => onMove(issue.id, next)}
          className="mt-3 w-full text-xs py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
        >
          {updating ? "Updating…" : `Move to ${next.replace("_", " ")}`}
        </button>
      )}
    </motion.div>
  );
};
