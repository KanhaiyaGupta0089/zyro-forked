import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Plus, 
  MoreVertical,
  Calendar as CalendarIcon,
  User
} from "lucide-react";
import { issueApi, IssueStatus } from "@/services/api/issueApi";

const KanbanTab = () => {
  const { id } = useParams();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState({
    todo: [] as any[],
    'in-progress': [] as any[],
    review: [] as any[],
    done: [] as any[],
  });

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        // Get issues for this project using the dedicated API endpoint
        const projectIssues = await issueApi.getIssuesByProject(Number(id));
        setIssues(projectIssues);
        
        // Group issues by status
        const groupedIssues = {
          todo: projectIssues.filter((issue: any) => issue.status?.toLowerCase() === 'todo' || issue.status?.toLowerCase() === 'open'),
          'in-progress': projectIssues.filter((issue: any) => issue.status?.toLowerCase() === 'in progress' || issue.status?.toLowerCase() === 'in-progress' || issue.status?.toLowerCase() === 'in_progress'),
          review: projectIssues.filter((issue: any) => issue.status?.toLowerCase() === 'review' || issue.status?.toLowerCase() === 'qa'),
          done: projectIssues.filter((issue: any) => issue.status?.toLowerCase() === 'completed' || issue.status?.toLowerCase() === 'closed'),
        };
        
        setColumns(groupedIssues);
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [id]);

  const updateIssueStatus = async (issueId: number, newStatus: string) => {
    try {
      // Update the issue status in the backend
      await issueApi.updateIssue(issueId, { status: newStatus as IssueStatus });
      
      // Update local state
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        )
      );
      
      // Regroup issues
      const updatedColumns = {
        todo: issues.filter((issue: any) => 
          (issue.status?.toLowerCase() === 'todo' || issue.status?.toLowerCase() === 'open') && issue.id !== issueId
        ).concat(newStatus === 'todo' || newStatus === 'open' ? issues.find((i: any) => i.id === issueId) : []),
        'in-progress': issues.filter((issue: any) => 
          (issue.status?.toLowerCase() === 'in progress' || issue.status?.toLowerCase() === 'in-progress' || issue.status?.toLowerCase() === 'in_progress') && issue.id !== issueId
        ).concat(newStatus === 'in progress' || newStatus === 'in-progress' || newStatus === 'in_progress' ? issues.find((i: any) => i.id === issueId) : []),
        review: issues.filter((issue: any) => 
          (issue.status?.toLowerCase() === 'review' || issue.status?.toLowerCase() === 'qa') && issue.id !== issueId
        ).concat((newStatus === 'review' || newStatus === 'qa') ? issues.find((i: any) => i.id === issueId) : []),
        done: issues.filter((issue: any) => 
          (issue.status?.toLowerCase() === 'completed' || issue.status?.toLowerCase() === 'closed') && issue.id !== issueId
        ).concat((newStatus === 'completed' || newStatus === 'closed') ? issues.find((i: any) => i.id === issueId) : []),
      };
      
      setColumns(updatedColumns);
    } catch (error) {
      console.error('Error updating issue status:', error);
      // Revert the UI if the API call fails
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === issueId ? { ...issue, status: issues.find(i => i.id === issueId)?.status || issue.status } : issue
        )
      );
      // Recalculate columns based on reverted state
      const revertedColumns = {
        todo: issues.filter((issue: any) => issue.status?.toLowerCase() === 'todo' || issue.status?.toLowerCase() === 'open'),
        'in-progress': issues.filter((issue: any) => issue.status?.toLowerCase() === 'in progress' || issue.status?.toLowerCase() === 'in-progress' || issue.status?.toLowerCase() === 'in_progress'),
        review: issues.filter((issue: any) => issue.status?.toLowerCase() === 'review' || issue.status?.toLowerCase() === 'qa'),
        done: issues.filter((issue: any) => issue.status?.toLowerCase() === 'completed' || issue.status?.toLowerCase() === 'closed'),
      };
      setColumns(revertedColumns);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mb-4"
        />
        <p className="text-gray-600 text-center">Loading Kanban board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Kanban Board</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
          <Plus size={18} />
          <span>Add Issue</span>
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-400/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500/80">
        {/* Todo Column */}
        <div className="flex-shrink-0 w-72">
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 rounded-lg">
            <h3 className="font-semibold text-gray-800">To Do</h3>
            <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
              {columns.todo.length}
            </span>
          </div>
          <div className="space-y-3 min-h-96">
            {columns.todo.map((issue) => (
              <KanbanCard 
                key={issue.id} 
                issue={issue} 
                onStatusChange={(newStatus) => updateIssueStatus(issue.id, newStatus)}
              />
            ))}
            {columns.todo.length === 0 && (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                No issues
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex-shrink-0 w-72">
          <div className="flex items-center justify-between mb-4 p-3 bg-yellow-100 rounded-lg">
            <h3 className="font-semibold text-gray-800">In Progress</h3>
            <span className="bg-yellow-200 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full">
              {columns['in-progress'].length}
            </span>
          </div>
          <div className="space-y-3 min-h-96">
            {columns['in-progress'].map((issue) => (
              <KanbanCard 
                key={issue.id} 
                issue={issue} 
                onStatusChange={(newStatus) => updateIssueStatus(issue.id, newStatus)}
              />
            ))}
            {columns['in-progress'].length === 0 && (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                No issues
              </div>
            )}
          </div>
        </div>

        {/* Review Column */}
        <div className="flex-shrink-0 w-72">
          <div className="flex items-center justify-between mb-4 p-3 bg-blue-100 rounded-lg">
            <h3 className="font-semibold text-gray-800">Review</h3>
            <span className="bg-blue-200 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
              {columns.review.length}
            </span>
          </div>
          <div className="space-y-3 min-h-96">
            {columns.review.map((issue) => (
              <KanbanCard 
                key={issue.id} 
                issue={issue} 
                onStatusChange={(newStatus) => updateIssueStatus(issue.id, newStatus)}
              />
            ))}
            {columns.review.length === 0 && (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                No issues
              </div>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div className="flex-shrink-0 w-72">
          <div className="flex items-center justify-between mb-4 p-3 bg-green-100 rounded-lg">
            <h3 className="font-semibold text-gray-800">Done</h3>
            <span className="bg-green-200 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
              {columns.done.length}
            </span>
          </div>
          <div className="space-y-3 min-h-96">
            {columns.done.map((issue) => (
              <KanbanCard 
                key={issue.id} 
                issue={issue} 
                onStatusChange={(newStatus) => updateIssueStatus(issue.id, newStatus)}
              />
            ))}
            {columns.done.length === 0 && (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                No issues
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Kanban Card Component
const KanbanCard = ({ issue, onStatusChange }: { issue: any; onStatusChange: (status: IssueStatus) => void; }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => {
        // Cycle through statuses
        const statuses: IssueStatus[] = ['todo', 'in_progress', 'completed', 'cancelled'];
        const currentIndex = statuses.indexOf(issue.status as IssueStatus);
        const nextIndex = (currentIndex + 1) % statuses.length;
        onStatusChange(statuses[nextIndex]);
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-800 text-sm truncate">{issue.title}</h4>
        <button className="p-1 rounded hover:bg-gray-100">
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      
      <p className="text-gray-600 text-xs mb-3 line-clamp-2">{issue.description}</p>
      
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{issue.assignee || 'Unassigned'}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-3 h-3" />
          <span>{new Date(issue.created).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default KanbanTab;