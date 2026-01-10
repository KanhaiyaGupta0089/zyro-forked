import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreVertical, Edit, Trash2 } from "lucide-react";
import { UIIssue } from "../hooks/useIssues";
import { types, priorities } from "../constants/issueConfig";

interface IssueCardProps {
  issue: UIIssue;
  onEdit: (issue: UIIssue) => void;
  onDelete: (issue: UIIssue) => void;
}

export const IssueCard = ({ issue, onEdit, onDelete }: IssueCardProps) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const TypeIcon = types[issue.type as keyof typeof types]?.icon;
  const typeColor = types[issue.type as keyof typeof types]?.color || "#6B778C";
  const priority = priorities[issue.priority as keyof typeof priorities];

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate on Ctrl+Click (or Cmd+Click on Mac)
    if (e.ctrlKey || e.metaKey) {
      // Don't navigate if clicking on menu button or menu
      if (
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('[role="menu"]')
      ) {
        return;
      }
      e.stopPropagation();
      navigate(`/issues/${issue.id}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-[#DFE1E6] rounded p-2.5 cursor-grab active:cursor-grabbing hover:border-[#0052CC] hover:shadow-sm transition-all relative ${
        isDragging ? "shadow-md opacity-50" : ""
      }`}
      onClick={handleCardClick}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <GripVertical className="w-3.5 h-3.5 text-[#6B778C] hover:text-[#0052CC] flex-shrink-0" />
            {TypeIcon && (
              <TypeIcon
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: typeColor }}
              />
            )}
            <span className="text-xs font-medium text-[#0052CC] whitespace-nowrap">
              {issue.id}
            </span>
            {issue.storyPoints && (
              <span className="text-xs text-[#6B778C] bg-[#F4F5F7] px-1.5 py-0.5 rounded flex-shrink-0">
                {issue.storyPoints}
              </span>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              className="p-0.5 hover:bg-[#F4F5F7] rounded text-[#6B778C] z-10 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div
                role="menu"
                className="absolute right-0 top-6 bg-white border border-[#DFE1E6] rounded shadow-lg z-20 min-w-[120px]"
              >
                <button
                  className="w-full px-3 py-2 text-left text-sm text-[#172B4D] hover:bg-[#F4F5F7] flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(issue);
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm text-[#DE350B] hover:bg-[#F4F5F7] flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete(issue);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <span className="text-sm text-[#172B4D] mb-2.5 font-normal leading-snug line-clamp-2">
          {issue.title}
        </span>

        <div className="flex items-center justify-between">
          <div
            className="px-1.5 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: priority.bgColor,
              color: priority.color,
            }}
          >
            {priority.label}
          </div>
          <div className="w-5 h-5 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {issue.assignee.avatar}
          </div>
        </div>
      </div>
    </div>
  );
};
