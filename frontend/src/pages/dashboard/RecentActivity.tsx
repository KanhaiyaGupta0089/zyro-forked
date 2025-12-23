import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  FolderKanban,
  Pencil,
} from "lucide-react";

const activities = [
  {
    id: 1,
    text: "Completed task “Fix auth bug”",
    time: "2 minutes ago",
    icon: CheckCircle,
  },
  {
    id: 2,
    text: "Created project “Zyro App”",
    time: "24 minutes ago",
    icon: FolderKanban,
  },
  {
    id: 3,
    text: "Updated task “Design UI”",
    time: "1 hour ago",
    icon: Pencil,
  },
  {
    id: 4,
    text: "Added a new team member",
    time: "3 hours ago",
    icon: User,
  },
  {
    id: 5,
    text: "Scheduled a meeting for tomorrow",
    time: "5 hours ago",
    icon: Calendar,
  },
];

const RecentActivity = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
            <Clock size={16} />
          </span>
          Recent Activity
        </h2>

        <button className="text-xs font-medium text-emerald-600 hover:underline">
          View all
        </button>
      </div>

      {/* Activity List */}
      <ul className="space-y-3">
        {activities.map((activity) => {
          const Icon = activity.icon;

          return (
            <li
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-emerald-100/50 transition"
            >
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Icon size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-emerald-800 truncate">
                  {activity.text}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {activity.time}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecentActivity;
