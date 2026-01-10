import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Edit, Trash2, Circle } from "lucide-react";
import { UIIssue } from "../hooks/useIssues";
import { types, priorities, statuses } from "../constants/issueConfig";

interface IssueListProps {
  issues: UIIssue[];
  onEdit: (issue: UIIssue) => void;
  onDelete: (issue: UIIssue) => void;
}

export const IssueList = ({ issues, onEdit, onDelete }: IssueListProps) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      key="list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white border border-[#DFE1E6] rounded overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F4F5F7] border-b border-[#DFE1E6]">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">
                Issue
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">
                Type
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">
                Priority
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">
                Project
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">
                Updated
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DFE1E6]">
            {issues.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-[#6B778C]">
                  No issues found
                </td>
              </tr>
            ) : (
              issues.map((issue, index) => {
                const TypeIcon = types[issue.type as keyof typeof types]?.icon || Circle;
                const typeColor = types[issue.type as keyof typeof types]?.color || "#6B778C";
                const priority = priorities[issue.priority as keyof typeof priorities];
                const status = statuses[issue.status];

                return (
                  <motion.tr
                    key={issue.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-[#F4F5F7] transition-colors group"
                    onClick={(e) => {
                      // Only navigate on Ctrl+Click (or Cmd+Click on Mac)
                      if (e.ctrlKey || e.metaKey) {
                        // Don't navigate if clicking on action buttons
                        if ((e.target as HTMLElement).closest('button')) {
                          return;
                        }
                        navigate(`/issues/${issue.id}`);
                      }
                    }}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <TypeIcon
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: typeColor }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              onClick={(e) => {
                                // Only navigate on Ctrl+Click (or Cmd+Click on Mac)
                                if (e.ctrlKey || e.metaKey) {
                                  e.stopPropagation();
                                  navigate(`/issues/${issue.id}`);
                                }
                              }}
                              className="text-sm font-medium text-[#0052CC]"
                            >
                              {issue.id}
                            </span>
                            <span className="text-sm text-[#172B4D]">
                              {issue.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: `${typeColor}15`,
                          color: typeColor,
                        }}
                      >
                        {types[issue.type as keyof typeof types]?.label || issue.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: priority.bgColor,
                          color: priority.color,
                        }}
                      >
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 w-fit"
                        style={{
                          backgroundColor: status.bgColor,
                          color: status.color,
                        }}
                      >
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-xs font-semibold">
                          {issue.assignee.avatar}
                        </div>
                        <span className="text-sm text-[#42526E]">
                          {issue.assignee.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-sm">
                        <div className="font-medium text-[#172B4D]">
                          {issue.project.key}
                        </div>
                        <div className="text-xs text-[#6B778C]">
                          {issue.project.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-sm text-[#6B778C]">
                        {issue.updated}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(issue);
                          }}
                          className="p-1 hover:bg-[#DFE1E6] rounded text-[#6B778C] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(issue);
                          }}
                          className="p-1 hover:bg-[#FFEBE6] rounded text-[#DE350B] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
