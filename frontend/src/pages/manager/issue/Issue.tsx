import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useIssues, UIIssue } from "./hooks/useIssues";
import { useIssueFilters } from "./hooks/useIssueFilters";
import { useIssueDragDrop } from "./hooks/useIssueDragDrop";
import { IssueHeader } from "./components/IssueHeader";
import { IssueBoard } from "./components/IssueBoard";
import { IssueList } from "./components/IssueList";
import { IssueModal } from "./components/IssueModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";

const Issues = () => {
  // State management
  const { issues, projects, isLoading, loadData, updateIssueStatus, deleteIssue } = useIssues();
  const {
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    filteredIssues,
    issuesByStatus,
  } = useIssueFilters(issues);

  const [selectedView, setSelectedView] = useState<"board" | "list">("board");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<UIIssue | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<UIIssue | null>(null);

  // Drag and drop setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Reduced from 8 to 1 for better pointer alignment
      },
    }),
    useSensor(KeyboardSensor)
  );

  const { activeIssue, handleDragStart, handleDragEnd } = useIssueDragDrop(
    issues,
    updateIssueStatus
  );

  // Event handlers
  const handleEdit = (issue: UIIssue) => {
    setEditingIssue(issue);
  };

  const handleDelete = (issue: UIIssue) => {
    setDeletingIssue(issue);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingIssue?.apiId) return;
    const success = await deleteIssue(deletingIssue.apiId);
    if (success) {
      setDeletingIssue(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
              .issue-column-scroll::-webkit-scrollbar {
                width: 2px;
              }

              .issue-column-scroll::-webkit-scrollbar-track {
                background: #F4F5F7;
              }

              .issue-column-scroll::-webkit-scrollbar-thumb {
                background: #C1C7D0;
                border-radius: 10px;
              }

              .issue-column-scroll::-webkit-scrollbar-thumb:hover {
                background: #A5ADBA;
              }
            `}
      </style>

      <div className="bg-white min-h-full">
        {/* Header */}
        <IssueHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          selectedView={selectedView}
          onViewChange={setSelectedView}
          onCreateClick={() => setShowCreateModal(true)}
        />

        {/* Content Area */}
        <div className="p-6 bg-[#F4F5F7]">
          <AnimatePresence mode="wait">
            {selectedView === "board" ? (
              <IssueBoard
                issuesByStatus={issuesByStatus}
                activeIssue={activeIssue}
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : (
              <IssueList
                issues={filteredIssues}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <IssueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        issue={null}
        projects={projects}
        onSave={loadData}
      />

      <IssueModal
        isOpen={!!editingIssue}
        onClose={() => setEditingIssue(null)}
        issue={editingIssue || null}
        projects={projects}
        onSave={loadData}
      />

      <DeleteConfirmModal
        isOpen={!!deletingIssue}
        onClose={() => setDeletingIssue(null)}
        issue={deletingIssue}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default Issues;
