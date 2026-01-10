import { memo, useMemo } from "react";

/* ======================================================
   🔹 INTERFACE
====================================================== */

interface SprintProgressChartProps {
  issueStatusDistribution: Record<string, number>;
  completionRate: number;
  size?: number;
}

/* ======================================================
   🔹 COMPONENT
====================================================== */

export const SprintProgressChart = memo<SprintProgressChartProps>(
  ({ issueStatusDistribution, completionRate, size = 200 }) => {
    const chartData = useMemo(() => {
      const statusColors: Record<string, string> = {
        todo: "#94a3b8",
        in_progress: "#3b82f6",
        completed: "#10b981",
        qa: "#8b5cf6",
        cancelled: "#ef4444",
        hold: "#f59e0b",
        blocked: "#dc2626",
      };

      const total = Object.values(issueStatusDistribution).reduce(
        (sum, count) => sum + count,
        0
      );

      if (total === 0) return null;

      let currentAngle = -90;
      const segments = Object.entries(issueStatusDistribution)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => {
          const percentage = (count / total) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;

          return {
            status,
            count,
            percentage,
            startAngle,
            angle,
            color: statusColors[status] || "#94a3b8",
          };
        });

      return { segments, total, radius: size / 2 - 10 };
    }, [issueStatusDistribution, size]);

    if (!chartData || chartData.segments.length === 0) {
      return (
        <div
          className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <p className="text-gray-500 text-sm">No data</p>
        </div>
      );
    }

    const center = size / 2;
    const radius = chartData.radius;

    const getPath = (startAngle: number, angle: number) => {
      const start = polarToCartesian(center, center, radius, startAngle);
      const end = polarToCartesian(center, center, radius, startAngle + angle);
      const largeArcFlag = angle > 180 ? 1 : 0;

      return [
        "M",
        center,
        center,
        "L",
        start.x,
        start.y,
        "A",
        radius,
        radius,
        0,
        largeArcFlag,
        1,
        end.x,
        end.y,
        "Z",
      ].join(" ");
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Issue Status Distribution
        </h3>
        <div className="flex items-center gap-6">
          {/* Pie Chart */}
          <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
            <svg width={size} height={size}>
              {chartData.segments.map((segment, index) => (
                <path
                  key={index}
                  d={getPath(segment.startAngle, segment.angle)}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
              {/* Center circle for donut */}
              <circle
                cx={center}
                cy={center}
                r={radius * 0.6}
                fill="white"
              />
              {/* Completion rate text */}
              <text
                x={center}
                y={center - 5}
                textAnchor="middle"
                className="text-lg font-bold fill-gray-700"
              >
                {completionRate}%
              </text>
              <text
                x={center}
                y={center + 10}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                Complete
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {chartData.segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-gray-600 capitalize">
                  {segment.status.replace("_", " ")}
                </span>
                <span className="ml-auto text-gray-500 font-medium">
                  {segment.count} ({segment.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

SprintProgressChart.displayName = "SprintProgressChart";

/* ======================================================
   🔹 HELPER
====================================================== */

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};




