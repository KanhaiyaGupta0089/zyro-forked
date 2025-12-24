import {
  Folder,
  CheckSquare,
  CheckCircle,
  Users,
} from "lucide-react";

import { useState, useEffect } from "react";
import { dashboardApi } from "../../services/api";
import { DashboardStats } from "../../services/api/types";

const HomeStats = () => {
  const [stats, setStats] = useState([
    { label: "Total Projects", value: 0, description: "All projects", icon: Folder },
    { label: "Active Issues", value: 0, description: "Needs attention", icon: CheckSquare },
    { label: "Completed Issues", value: 0, description: "This month", icon: CheckCircle },
    { label: "Team Members", value: 0, description: "Active contributors", icon: Users },
  ]);
  
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        // Fetch dashboard stats using the dashboard API
        const statsData = await dashboardApi.getDashboardStats() as DashboardStats;
        
        setStats([
          { label: "Total Projects", value: statsData.total_projects, description: "All projects", icon: Folder },
          { label: "Active Issues", value: statsData.active_issues, description: "Needs attention", icon: CheckSquare },
          { label: "Completed Issues", value: statsData.completed_issues, description: "This month", icon: CheckCircle },
          { label: "Team Members", value: statsData.team_members, description: "Active contributors", icon: Users },
        ]);
      } catch (error) {
        console.error('Error fetching stats data:', error);
        // Keep default values in case of error
      }
    };
    
    fetchStatsData();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between">
              {/* Left */}
              <div>
                <p className="text-sm text-sky-700">{stat.label}</p>

                <div className="mt-1">
                  <p className="text-2xl font-semibold text-sky-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
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

export default HomeStats;
