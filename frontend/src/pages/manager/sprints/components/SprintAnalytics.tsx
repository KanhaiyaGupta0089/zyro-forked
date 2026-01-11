import { memo } from "react";
import { TrendingUp, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { SprintAnalytics as SprintAnalyticsType } from "../hooks/useSprintAnalytics";
import { BurndownChart } from "./BurndownChart";
import { VelocityChart } from "./VelocityChart";
import { SprintProgressChart } from "./SprintProgressChart";

/* ======================================================
   🔹 INTERFACE
====================================================== */

interface SprintAnalyticsProps {
  analytics: SprintAnalyticsType;
}

/* ======================================================
   🔹 COMPONENT
====================================================== */

export const SprintAnalytics = memo<SprintAnalyticsProps>(({ analytics }) => {
  const healthColors = {
    "on-track": "bg-green-100 text-green-700 border-green-200",
    "at-risk": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "behind": "bg-red-100 text-red-700 border-red-200",
  };

  const healthIcons = {
    "on-track": CheckCircle2,
    "at-risk": AlertTriangle,
    "behind": AlertTriangle,
  };

  const HealthIcon = healthIcons[analytics.sprintHealth];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Issues</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.totalIssues}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.completedIssues}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">In Progress</span>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.inProgressIssues}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Completion Rate</span>
            <HealthIcon className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.completionRate}%
          </p>
        </div>
      </div>

      {/* Sprint Health */}
      {analytics.daysRemaining !== null && (
        <div
          className={`
            bg-white rounded-lg border-2 p-4
            ${healthColors[analytics.sprintHealth]}
          `}
        >
          <div className="flex items-center gap-3">
            <HealthIcon className="w-5 h-5" />
            <div>
              <p className="font-semibold">Sprint Health: {analytics.sprintHealth.replace("-", " ").toUpperCase()}</p>
              <p className="text-sm opacity-90">
                {analytics.daysRemaining > 0
                  ? `${analytics.daysRemaining} days remaining`
                  : analytics.daysRemaining === 0
                  ? "Ends today"
                  : `${Math.abs(analytics.daysRemaining)} days overdue`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown Chart */}
        {analytics.burndownData.length > 0 ? (
          <BurndownChart data={analytics.burndownData} height={250} />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Burndown Chart
            </h3>
            <div className="flex items-center justify-center h-[250px] bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-2">No burndown data available</p>
                <p className="text-gray-400 text-xs">
                  {analytics.totalIssues === 0
                    ? "Add issues to this sprint to see burndown chart"
                    : "Set sprint start and end dates to see burndown chart"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Velocity Chart */}
        {analytics.velocityData.length > 0 ? (
          <VelocityChart data={analytics.velocityData} height={250} />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Velocity Chart
            </h3>
            <div className="flex items-center justify-center h-[250px] bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-2">No velocity data available</p>
                <p className="text-gray-400 text-xs">
                  {analytics.totalIssues === 0
                    ? "Add issues to sprints to see velocity trends"
                    : "Complete more sprints with issues to see velocity trends"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Chart */}
        <div className="lg:col-span-2">
          {analytics.totalIssues > 0 ? (
            <SprintProgressChart
              issueStatusDistribution={analytics.issueStatusDistribution}
              completionRate={analytics.completionRate}
              size={250}
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Issue Status Distribution
              </h3>
              <div className="flex items-center justify-center h-[250px] bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2">No issues in this sprint</p>
                  <p className="text-gray-400 text-xs">
                    Add issues to see status distribution
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SprintAnalytics.displayName = "SprintAnalytics";

