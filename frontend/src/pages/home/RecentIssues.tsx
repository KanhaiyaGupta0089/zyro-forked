import {
  User,
  Bug,
} from "lucide-react";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardApi } from "../../services/api";
import { Issue } from "../../services/api/types";

const RecentIssues = () => {
  const navigate = useNavigate();
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRecentIssues = async () => {
      try {
        setLoading(true);
        // Fetch recent issues using the dashboard API
        const recentIssues = await dashboardApi.getRecentIssues(4) as Issue[];
        setIssues(recentIssues);
        setError(null);
      } catch (err) {
        console.error('Error fetching recent issues:', err);
        setError('Failed to load recent issues. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentIssues();
  }, []);
  
  // Function to get status color based on status
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case "canceled":
        return "bg-red-100 text-red-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "to do":
        return "bg-green-100 text-green-800";
      case "hold":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Function to get priority color based on priority
  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  if (loading && issues.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
              <Bug size={16} />
            </span>
            Recent Issues
          </h2>
          <button 
            className="text-xs font-medium text-amber-600 hover:underline"
            onClick={() => navigate('/issues')}
          >
            View all
          </button>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">Loading issues...</p>
        </div>
      </div>
    );
  }
  
  if (error && issues.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
              <Bug size={16} />
            </span>
            Recent Issues
          </h2>
          <button 
            className="text-xs font-medium text-amber-600 hover:underline"
            onClick={() => navigate('/issues')}
          >
            View all
          </button>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }
  
  // Function to render loading/error states
  const renderState = (isLoading: boolean, errorState: string | null, items: Issue[], title: string, icon: JSX.Element, navigateTo: string) => {
    if (isLoading && items.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                {icon}
              </span>
              {title}
            </h2>
            <button 
              className="text-xs font-medium text-amber-600 hover:underline"
              onClick={() => navigate(navigateTo)}
            >
              View all
            </button>
          </div>
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">Loading {title.toLowerCase()}...</p>
          </div>
        </div>
      );
    }
  
    if (errorState && items.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                {icon}
              </span>
              {title}
            </h2>
            <button 
              className="text-xs font-medium text-amber-600 hover:underline"
              onClick={() => navigate(navigateTo)}
            >
              View all
            </button>
          </div>
          <div className="flex items-center justify-center h-32">
            <p className="text-red-500">{errorState}</p>
          </div>
        </div>
      );
    }
      
    return null; // Return null when not in loading/error state
  };
  
  // Check if we're in loading or error state
  const stateElement = renderState(loading, error, issues, 'Recent Issues', <Bug size={16} />, '/issues');
  if (stateElement) {
    return stateElement;
  }
    
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
            <Bug size={16} />
          </span>
          Recent Issues
        </h2>
  
        <button 
          className="text-xs font-medium text-amber-600 hover:underline"
          onClick={() => navigate('/issues')}
        >
          View all
        </button>
      </div>
  
      {/* Issue List */}
      <ul className="space-y-3">
        {issues.map((issue) => (
          <li
            key={issue.id}
            className="p-3 rounded-lg hover:bg-amber-50 transition cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-amber-900 text-sm truncate">
                    {issue.title}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(issue.priority)}`}>
                    {issue.priority}
                  </span>
                </div>
                  
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                    
                  <div className="text-xs text-gray-500 flex items-center">
                    <User size={10} className="mr-1" />
                    {issue.assignee}
                  </div>
                    
                  <div className="text-xs text-gray-500 truncate">
                    {issue.project}
                  </div>
                </div>
              </div>
                
              <div className="text-xs text-gray-500 ml-2 flex flex-col items-end">
                <span>{issue.created}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentIssues;