import { useMemo } from "react";
import { Sprint, Issue } from "@/services/api/types";

/* ======================================================
   🔹 ANALYTICS INTERFACES
====================================================== */

export interface BurndownDataPoint {
  date: string;
  ideal: number;
  actual: number;
}

export interface VelocityData {
  sprintId: number;
  sprintName: string;
  completedIssues: number;
  totalIssues: number;
  completionRate: number;
}

export interface SprintAnalytics {
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  todoIssues: number;
  completionRate: number;
  daysRemaining: number | null;
  burndownData: BurndownDataPoint[];
  velocityData: VelocityData[];
  issueStatusDistribution: Record<string, number>;
  sprintHealth: "on-track" | "at-risk" | "behind";
}

/* ======================================================
   🔹 HOOK IMPLEMENTATION
====================================================== */

export const useSprintAnalytics = (
  sprint: Sprint | null,
  allSprints: Sprint[] = []
): SprintAnalytics => {
  return useMemo(() => {
    if (!sprint) {
      return {
        totalIssues: 0,
        completedIssues: 0,
        inProgressIssues: 0,
        todoIssues: 0,
        completionRate: 0,
        daysRemaining: null,
        burndownData: [],
        velocityData: [],
        issueStatusDistribution: {},
        sprintHealth: "on-track",
      };
    }

    const issues = sprint.issues || [];
    const totalIssues = issues.length;
    const completedIssues = issues.filter(
      (i) => i.status === "completed"
    ).length;
    const inProgressIssues = issues.filter(
      (i) => i.status === "in_progress"
    ).length;
    const todoIssues = issues.filter((i) => i.status === "todo").length;
    const completionRate =
      totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

    const daysRemaining = sprint.end_date
      ? Math.ceil(
          (new Date(sprint.end_date).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    const burndownData = generateBurndownData(sprint, issues);
    // For sprint detail page, show current sprint + recent sprints for comparison
    const velocityData = generateVelocityData(sprint, allSprints);
    const issueStatusDistribution = getIssueStatusDistribution(issues);

    const sprintHealth = calculateSprintHealth(
      completionRate,
      daysRemaining,
      totalIssues,
      completedIssues
    );

    return {
      totalIssues,
      completedIssues,
      inProgressIssues,
      todoIssues,
      completionRate,
      daysRemaining,
      burndownData,
      velocityData,
      issueStatusDistribution,
      sprintHealth,
    };
  }, [sprint, allSprints]);
};

/* ======================================================
   🔹 HELPER FUNCTIONS
====================================================== */

const generateBurndownData = (
  sprint: Sprint,
  issues: Issue[]
): BurndownDataPoint[] => {
  if (!sprint.start_date || !sprint.end_date) {
    return [];
  }

  const startDate = new Date(sprint.start_date);
  const endDate = new Date(sprint.end_date);
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalIssues = issues.length;

  if (totalDays <= 0 || totalIssues === 0) {
    return [];
  }

  const data: BurndownDataPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const ideal = totalIssues - (totalIssues / totalDays) * i;

    let actual = totalIssues;
    if (date <= today) {
      const completedByDate = issues.filter((issue) => {
        if (!issue.updated_at) return false;
        const issueDate = new Date(issue.updated_at);
        issueDate.setHours(0, 0, 0, 0);
        return issueDate <= date && issue.status === "completed";
      }).length;
      actual = totalIssues - completedByDate;
    }

    data.push({
      date: date.toISOString().split("T")[0],
      ideal: Math.max(0, ideal),
      actual: Math.max(0, actual),
    });
  }

  return data;
};

const generateVelocityData = (currentSprint: Sprint | null, allSprints: Sprint[]): VelocityData[] => {
  if (!currentSprint) {
    return [];
  }
  
  // Remove duplicates by sprint ID
  const uniqueSprints = Array.from(
    new Map(allSprints.map(s => [s.id, s])).values()
  );
  
  // Get current sprint data
  const currentIssues = currentSprint.issues || [];
  const currentTotalIssues = currentIssues.length;
  const currentCompletedIssues = currentIssues.filter(
    (i) => i.status === "completed"
  ).length;
  const currentCompletionRate =
    currentTotalIssues > 0
      ? Math.round((currentCompletedIssues / currentTotalIssues) * 100)
      : 0;
  
  const currentSprintData: VelocityData = {
    sprintId: currentSprint.id,
    sprintName: currentSprint.name,
    completedIssues: currentCompletedIssues,
    totalIssues: currentTotalIssues,
    completionRate: currentCompletionRate,
  };
  
  // Get other sprints for comparison (excluding current sprint)
  // Only show recently completed sprints for velocity trend comparison
  const otherSprints = uniqueSprints
    .filter((s) => {
      // Exclude current sprint
      if (s.id === currentSprint.id) return false;
      // Only include completed sprints with issues (for velocity trends)
      const isCompleted = s.status === "completed";
      const hasIssues = (s.issues && s.issues.length > 0) || false;
      return isCompleted && hasIssues;
    })
    .map((sprint) => {
      const issues = sprint.issues || [];
      const totalIssues = issues.length;
      const completedIssues = issues.filter(
        (i) => i.status === "completed"
      ).length;
      const completionRate =
        totalIssues > 0
          ? Math.round((completedIssues / totalIssues) * 100)
          : 0;

      return {
        sprintId: sprint.id,
        sprintName: sprint.name,
        completedIssues,
        totalIssues,
        completionRate,
        // Store date for sorting
        endDate: sprint.end_date,
        startDate: sprint.start_date,
      };
    })
    .sort((a, b) => {
      // Sort by end_date descending (most recently completed first)
      const dateA = a.endDate ? new Date(a.endDate).getTime() : (a.startDate ? new Date(a.startDate).getTime() : 0);
      const dateB = b.endDate ? new Date(b.endDate).getTime() : (b.startDate ? new Date(b.startDate).getTime() : 0);
      if (dateB !== dateA) return dateB - dateA; // Most recent first
      return b.sprintId - a.sprintId; // Fallback to ID if dates are equal
    })
    .slice(0, 4) // Get 4 most recently completed sprints
    .reverse() // Reverse to show in chronological order (oldest to newest for trend visualization)
    .map(({ endDate, startDate, ...rest }) => rest); // Remove date fields from final data
  
  // Combine: current sprint first, then other sprints
  const velocityData = [currentSprintData, ...otherSprints];
  
  return velocityData;
};

const getIssueStatusDistribution = (
  issues: Issue[]
): Record<string, number> => {
  const distribution: Record<string, number> = {};
  issues.forEach((issue) => {
    distribution[issue.status] = (distribution[issue.status] || 0) + 1;
  });
  return distribution;
};

const calculateSprintHealth = (
  completionRate: number,
  daysRemaining: number | null,
  totalIssues: number,
  completedIssues: number
): "on-track" | "at-risk" | "behind" => {
  if (daysRemaining === null) return "on-track";

  const expectedProgress = daysRemaining <= 0 ? 100 : Math.max(0, 100 - (daysRemaining / 14) * 100);
  const actualProgress = completionRate;

  if (actualProgress >= expectedProgress - 10) {
    return "on-track";
  } else if (actualProgress >= expectedProgress - 25) {
    return "at-risk";
  } else {
    return "behind";
  }
};

