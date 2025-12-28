import {
  Plus,
  FolderPlus,
  UserPlus,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";

const quickActions = [
  { label: "Create Project", icon: FolderPlus },
  { label: "Add Task", icon: Plus },
  { label: "Add Member", icon: UserPlus },
  { label: "View Reports", icon: BarChart3 },
];

const QuickActions = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      {/* Header */}
      <h2 className="text-sm font-semibold text-amber-800 mb-4 flex items-center gap-2">
        <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
          <Plus size={16} />
        </span>
        Quick Actions
      </h2>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg
              bg-white/70 border border-amber-200/50 hover:bg-amber-100/50 transition"
            >
              <Icon size={20} className="text-amber-600" />
              <span className="text-xs font-medium text-amber-700">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
