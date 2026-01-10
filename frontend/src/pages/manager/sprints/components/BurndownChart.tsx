import { memo, useMemo } from "react";
import { BurndownDataPoint } from "../hooks/useSprintAnalytics";

/* ======================================================
   🔹 INTERFACE
====================================================== */

interface BurndownChartProps {
  data: BurndownDataPoint[];
  height?: number;
}

/* ======================================================
   🔹 COMPONENT
====================================================== */

export const BurndownChart = memo<BurndownChartProps>(
  ({ data, height = 200 }) => {
    const chartData = useMemo(() => {
      if (data.length === 0) return null;

      const maxValue = Math.max(
        ...data.map((d) => Math.max(d.ideal, d.actual))
      );
      const minValue = 0;
      const range = maxValue - minValue || 1;

      return {
        maxValue,
        minValue,
        range,
        points: data.map((point, index) => ({
          ...point,
          x: (index / (data.length - 1 || 1)) * 100,
          idealY: 100 - ((point.ideal - minValue) / range) * 100,
          actualY: 100 - ((point.actual - minValue) / range) * 100,
        })),
      };
    }, [data]);

    if (!chartData || chartData.points.length === 0) {
      return (
        <div
          className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
          style={{ height: `${height}px` }}
        >
          <p className="text-gray-500 text-sm">No burndown data available</p>
        </div>
      );
    }

    const idealPath = chartData.points
      .map(
        (p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.idealY}`
      )
      .join(" ");

    const actualPath = chartData.points
      .map(
        (p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.actualY}`
      )
      .join(" ");

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Burndown Chart
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

            {/* Ideal line */}
            <path
              d={idealPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="2,2"
            />

            {/* Actual line */}
            <path
              d={actualPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />

            {/* Data points */}
            {chartData.points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.actualY}
                  r="1"
                  fill="#3b82f6"
                />
              </g>
            ))}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
            <span>{Math.round(chartData.maxValue)}</span>
            <span>{Math.round(chartData.maxValue / 2)}</span>
            <span>0</span>
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
            {chartData.points
              .filter((_, i) => i % Math.ceil(chartData.points.length / 5) === 0)
              .map((point, i) => (
                <span key={i}>
                  {new Date(point.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500" />
            <span className="text-gray-600">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-400 border-dashed border-t-2" />
            <span className="text-gray-600">Ideal</span>
          </div>
        </div>
      </div>
    );
  }
);

BurndownChart.displayName = "BurndownChart";




