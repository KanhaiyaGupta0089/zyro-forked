import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { GripVertical, Circle } from "lucide-react";
import { IssueStatus } from "@/services/api/issueApi";
import { UIIssue } from "../hooks/useIssues";
import { IssueColumn } from "./IssueColumn";
import { statuses, types } from "../constants/issueConfig";

interface IssueBoardProps {
  issuesByStatus: Record<IssueStatus, UIIssue[]>;
  activeIssue: UIIssue | null;
  pointerOffset?: { x: number; y: number } | null;
  sensors: any;
  onDragStart: (event: any) => void;
  onDragEnd: (event: any) => void;
  onEdit: (issue: UIIssue) => void;
  onDelete: (issue: UIIssue) => void;
}

export const IssueBoard = ({
  issuesByStatus,
  activeIssue,
  pointerOffset,
  sensors,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}: IssueBoardProps) => {
  return (
    <motion.div
      key="board"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="overflow-x-auto pb-4 ml-2"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 min-w-max">
          {(Object.keys(statuses) as IssueStatus[]).map((statusKey) => (
            <IssueColumn
              key={statusKey}
              statusKey={statusKey}
              issues={issuesByStatus[statusKey] || []}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeIssue ? (
            (() => {
              const TypeIcon = types[activeIssue.type as keyof typeof types]?.icon || Circle;
              const typeColor = types[activeIssue.type as keyof typeof types]?.color || "#6B778C";

              return (
                <div 
                  className="bg-white border-2 border-[#0052CC] rounded p-2.5 w-72 shadow-xl cursor-grabbing" 
                  style={{ 
                    pointerEvents: 'none',
                    transform: pointerOffset 
                      ? `translate(-${pointerOffset.x}px, -${pointerOffset.y}px)`
                      : undefined,
                    transformOrigin: '0 0',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <GripVertical className="w-3.5 h-3.5 text-[#0052CC]" />
                    <TypeIcon
                      className="w-3.5 h-3.5"
                      style={{ color: typeColor }}
                    />
                    <span className="text-xs font-medium text-[#0052CC]">
                      {activeIssue.id}
                    </span>
                  </div>
                  <h4 className="text-sm text-[#172B4D] font-normal line-clamp-2">
                    {activeIssue.title}
                  </h4>
                </div>
              );
            })()
          ) : null}
        </DragOverlay>
      </DndContext>
    </motion.div>
  );
};
