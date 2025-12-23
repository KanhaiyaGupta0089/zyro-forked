import {
  TrendingUp,
  TrendingDown,
  Folder,
  CheckSquare,
  CheckCircle,
  Users,
} from "lucide-react";

const stats = [
  {
    label: "Projects",
    value: 8,
    change: "+2",
    trend: "up",
    icon: Folder,
  },
  {
    label: "Tasks",
    value: 32,
    change: "+5",
    trend: "up",
    icon: CheckSquare,
  },
  {
    label: "Completed",
    value: 21,
    change: "+3",
    trend: "up",
    icon: CheckCircle,
  },
  {
    label: "Team Members",
    value: 5,
    change: "+1",
    trend: "up",
    icon: Users,
  },
];

const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="bg-gradient-to-br from-sky-200 to-blue-200 border border-sky-300/50 rounded-xl p-5 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between">
              {/* Left */}
              <div>
                <p className="text-sm text-sky-700">{stat.label}</p>

                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-semibold text-sky-900">
                    {stat.value}
                  </p>

                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${
                      stat.trend === "up"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {stat.change}
                  </span>
                </div>
              </div>

              {/* Right Icon */}
              <div className="p-2 rounded-lg bg-sky-200 text-sky-700">
                <Icon size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
