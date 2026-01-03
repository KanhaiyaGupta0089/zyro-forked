import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { UIIssue } from "./useIssues";
import { IssueStatus } from "@/services/api/types";
import { RootState } from "@/redux/store";

export const useIssueFilters = (issues: UIIssue[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  
  // Get current user from redux auth state
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        String(issue.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.project.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedFilter === "all") return true;

      if (selectedFilter === "my-issues") {
        if (currentUser && currentUser.id) {
          // Compare by user ID for reliability
          // Convert to string for comparison since IDs might be different types
          return String(issue.assignee.id) === String(currentUser.id);
        }
        return false;
      }

      return issue.status === selectedFilter;
    });
  }, [issues, searchQuery, selectedFilter, currentUser]);

  const issuesByStatus = useMemo(() => {
    const statuses: IssueStatus[] = [
      "todo",
      "in_progress",
      "completed",
      "cancelled",
      "hold",
      "qa",
      "blocked",
    ];

    return statuses.reduce((acc, status) => {
      acc[status] = filteredIssues.filter(
        (issue) => issue.status === status
      );
      return acc;
    }, {} as Record<IssueStatus, UIIssue[]>);
  }, [filteredIssues]);

  return {
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    filteredIssues,
    issuesByStatus,
  };
};
