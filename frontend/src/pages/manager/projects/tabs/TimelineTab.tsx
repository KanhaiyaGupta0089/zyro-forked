import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Plus,
  MoreVertical,
} from "lucide-react";
import { projectApi } from "@/services/api/projectApi";

/* ======================================================
   TYPES
====================================================== */

type MilestoneStatus = "completed" | "in_progress" | "upcoming" | "overdue";

interface Milestone {
  id: number;
  name: string;
  date: string;
  description?: string;
  status: MilestoneStatus;
}

/* ======================================================
   HELPERS
====================================================== */

const daysBetween = (a: Date, b: Date) =>
  Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString() : "—";

/* ======================================================
   COMPONENT
====================================================== */

const TimelineTab = () => {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
      FETCH
  =============================== */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const p = await projectApi.getProjectById(+id);
        setProject(p);

        const start = new Date(p.start_date);
        const end = new Date(p.end_date);
        const today = new Date();

        const midpoint = new Date(
          start.getTime() + (end.getTime() - start.getTime()) / 2
        );

        const autoMilestones: Milestone[] = [
          {
            id: 1,
            name: "Project Start",
            date: p.start_date,
            description: "Work officially started",
            status: today >= start ? "completed" : "upcoming",
          },
          {
            id: 2,
            name: "Midpoint Review",
            date: midpoint.toISOString(),
            description: "Delivery health checkpoint",
            status:
              today > midpoint
                ? today > end
                  ? "completed"
                  : "in_progress"
                : "upcoming",
          },
          {
            id: 3,
            name: "Project Deadline",
            date: p.end_date,
            description: "Final delivery date",
            status:
              today > end
                ? "overdue"
                : today >= end
                ? "completed"
                : "upcoming",
          },
        ];

        setMilestones(autoMilestones);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* ===============================
      DERIVED METRICS
  =============================== */
  const timelineStats = useMemo(() => {
    if (!project) return null;

    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const today = new Date();

    const total = daysBetween(start, end);
    const elapsed = Math.max(0, daysBetween(start, today));
    const remaining = Math.max(0, daysBetween(today, end));

    const progress = Math.min(100, Math.round((elapsed / total) * 100));

    const health =
      today > end
        ? "Delayed"
        : progress > 80
        ? "On Track"
        : progress > 50
        ? "Attention"
        : "Early Stage";

    return { progress, remaining, health };
  }, [project]);

  /* ===============================
      LOADING
  =============================== */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Clock className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="mt-3 text-gray-500">Loading timeline…</p>
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
            Project Timeline
          </h2>
          <p className="text-sm text-gray-500">
            Track delivery progress & risks
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          Add Milestone
        </button>
      </div>

      {/* SUMMARY */}
      {timelineStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat
            label="Progress"
            value={`${timelineStats.progress}%`}
            color="indigo"
          />
          <Stat
            label="Days Remaining"
            value={`${timelineStats.remaining}`}
            color="blue"
          />
          <Stat
            label="Health"
            value={timelineStats.health}
            color={
              timelineStats.health === "Delayed"
                ? "red"
                : timelineStats.health === "Attention"
                ? "yellow"
                : "green"
            }
          />
        </div>
      )}

      {/* DATE RANGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateCard label="Start Date" value={formatDate(project.start_date)} />
        <DateCard label="End Date" value={formatDate(project.end_date)} />
      </div>

      {/* MILESTONES */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Milestones</h3>

        <div className="relative pl-6 space-y-6">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />

          {milestones.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <StatusDot status={m.status} />

              <div className="ml-6 bg-white border rounded-xl p-4 shadow-sm">
                <div className="flex justify-between gap-4">
                  <div>
                    <h4 className="font-semibold">{m.name}</h4>
                    <p className="text-sm text-gray-500">
                      {m.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(m.date)}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <StatusBadge status={m.status} />
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineTab;

/* ======================================================
   SMALL UI PARTS
====================================================== */

const Stat = ({ label, value, color }: any) => (
  <div className="bg-white border rounded-xl p-4 shadow-sm">
    <p className="text-xs text-gray-500">{label}</p>
    <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
  </div>
);

const DateCard = ({ label, value }: any) => (
  <div className="bg-white border rounded-xl p-4 shadow-sm">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);

const StatusDot = ({ status }: { status: MilestoneStatus }) => {
  const color =
    status === "completed"
      ? "bg-green-500"
      : status === "in_progress"
      ? "bg-blue-500 animate-pulse"
      : status === "overdue"
      ? "bg-red-500"
      : "bg-gray-300";

  return (
    <div
      className={`absolute -left-1.5 top-4 w-3 h-3 rounded-full ${color}`}
    />
  );
};

const StatusBadge = ({ status }: { status: MilestoneStatus }) => {
  const map: Record<MilestoneStatus, string> = {
    completed: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    upcoming: "bg-gray-100 text-gray-700",
    overdue: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${map[status]}`}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
};
