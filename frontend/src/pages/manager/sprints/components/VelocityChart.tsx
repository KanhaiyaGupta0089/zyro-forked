import { memo, useMemo } from "react";
import { VelocityData } from "../hooks/useSprintAnalytics";

/* ======================================================
   🔹 INTERFACE
====================================================== */

interface VelocityChartProps {
  data: VelocityData[];
  height?: number;
}

/* ======================================================
   🔹 COMPONENT
====================================================== */

export const VelocityChart = memo<VelocityChartProps>(
  ({ data, height = 200 }) => {
    const chartData = useMemo(() => {
      if (data.length === 0) {
        return null;
      }

      const maxValue = Math.max(...data.map((d) => d.totalIssues), 1);
      const barWidth = 100 / data.length;

      return {
        maxValue,
        barWidth,
        bars: data.map((item, index) => ({
          ...item,
          x: index * barWidth,
          width: barWidth * 0.8,
          completedHeight: (item.completedIssues / maxValue) * 100,
          totalHeight: (item.totalIssues / maxValue) * 100,
        })),
      };
    }, [data]);

    if (!chartData || chartData.bars.length === 0) {
      return (
        <div
          className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
          style={{ height: `${height}px` }}
        >
          <p className="text-gray-500 text-sm">No velocity data available</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Velocity Chart
        </h3>
        <div className="relative" style={{ height: `${height}px` }}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            ))}

            {/* Bars */}
            {chartData.bars.map((bar, index) => (
              <g key={index}>
                {/* Total bar (background) */}
                <rect
                  x={bar.x + bar.width * 0.1}
                  y={100 - bar.totalHeight}
                  width={bar.width * 0.8}
                  height={bar.totalHeight}
                  fill="#e5e7eb"
                  rx="1"
                />
                {/* Completed bar */}
                <rect
                  x={bar.x + bar.width * 0.1}
                  y={100 - bar.completedHeight}
                  width={bar.width * 0.8}
                  height={bar.completedHeight}
                  fill="#10b981"
                  rx="1"
                />
              </g>
            ))}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
            <span>{chartData.maxValue}</span>
            <span>{Math.round(chartData.maxValue / 2)}</span>
            <span>0</span>
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-around text-xs text-gray-500 mt-2">
            {chartData.bars.map((bar, index) => (
              <div
                key={index}
                className="flex-1 text-center truncate"
                title={bar.sprintName}
              >
                {bar.sprintName.length > 10
                  ? `${bar.sprintName.substring(0, 10)}...`
                  : bar.sprintName}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <span className="text-gray-600">Total</span>
          </div>
        </div>
      </div>
    );
  }
);

VelocityChart.displayName = "VelocityChart";

