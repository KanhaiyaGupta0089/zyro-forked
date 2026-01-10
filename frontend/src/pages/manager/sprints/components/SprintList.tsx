import { memo, useState, useMemo } from "react";
import { Sprint } from "@/services/api/types";
import { getStatusConfig, formatDateRange, getDaysRemaining, getSprintProgress } from "../constants/sprintConfig";
import { MoreVertical, Edit, Trash2, ExternalLink } from "lucide-react";

/* ======================================================
   🔹 INTERFACE
====================================================== */

interface SprintListProps {
  sprints: Sprint[];
  onSprintClick: (sprint: Sprint) => void;
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprint: Sprint) => void;
}

type SortField = "name" | "status" | "start_date" | "end_date" | "progress";
type SortDirection = "asc" | "desc";

/* ======================================================
   🔹 COMPONENT
====================================================== */

export const SprintList = memo<SprintListProps>(
  ({ sprints, onSprintClick, onEdit, onDelete }) => {
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const sortedSprints = useMemo(() => {
      const sorted = [...sprints];
      sorted.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          case "start_date":
            aValue = a.start_date ? new Date(a.start_date).getTime() : 0;
            bValue = b.start_date ? new Date(b.start_date).getTime() : 0;
            break;
          case "end_date":
            aValue = a.end_date ? new Date(a.end_date).getTime() : 0;
            bValue = b.end_date ? new Date(b.end_date).getTime() : 0;
            break;
          case "progress":
            const aIssues = a.issues || [];
            const bIssues = b.issues || [];
            aValue = getSprintProgress(
              aIssues.length,
              aIssues.filter((i) => i.status === "completed").length
            );
            bValue = getSprintProgress(
              bIssues.length,
              bIssues.filter((i) => i.status === "completed").length
            );
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
      return sorted;
    }, [sprints, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
      if (sortField !== field) return null;
      return (
        <span className="ml-1 text-gray-400">
          {sortDirection === "asc" ? "↑" : "↓"}
        </span>
      );
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  Sprint Name
                  <SortIcon field="name" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("status")}
                >
                  Status
                  <SortIcon field="status" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("start_date")}
                >
                  Date Range
                  <SortIcon field="start_date" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("progress")}
                >
                  Progress
                  <SortIcon field="progress" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issues
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSprints.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No sprints found
                  </td>
                </tr>
              ) : (
                sortedSprints.map((sprint) => {
                  const statusConfig = getStatusConfig(sprint.status);
                  const issues = sprint.issues || [];
                  const totalIssues = issues.length;
                  const completedIssues = issues.filter(
                    (i) => i.status === "completed"
                  ).length;
                  const progress = getSprintProgress(totalIssues, completedIssues);
                  const daysRemaining = getDaysRemaining(sprint.end_date);

                  return (
                    <tr
                      key={sprint.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onSprintClick(sprint)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {sprint.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sprint.sprint_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {sprint.project?.name || `Project ${sprint.project_id}`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`
                            ${statusConfig.badgeColor}
                            px-2 py-1 rounded-full text-xs font-medium
                          `}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDateRange(sprint.start_date, sprint.end_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        <span className="font-medium">{completedIssues}</span>/
                        {totalIssues}
                        {daysRemaining !== null && daysRemaining < 0 && (
                          <span className="ml-2 text-red-500 text-xs">
                            Overdue
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === sprint.id ? null : sprint.id
                              );
                            }}
                            className="p-1 rounded hover:bg-gray-200"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                          {openMenuId === sprint.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSprintClick(sprint);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(sprint);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(sprint);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

SprintList.displayName = "SprintList";




