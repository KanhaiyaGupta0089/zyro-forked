import {
  Folder,
  User,
} from "lucide-react";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardApi } from "../../services/api";
import { Project } from "../../services/api/types";

const RecentProjects = () => {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        setLoading(true);
        // Fetch recent projects using the dashboard API
        const recentProjects = await dashboardApi.getRecentProjects(4) as Project[];
        setProjects(recentProjects);
        setError(null);
      } catch (err) {
        console.error('Error fetching recent projects:', err);
        setError('Failed to load recent projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProjects();
  }, []);
  
  // Function to get status color based on status
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "upcoming":
        return "bg-purple-100 text-purple-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Function to render loading/error states
  const renderState = (isLoading: boolean, errorState: string | null, items: Project[], title: string, icon: JSX.Element, navigateTo: string) => {
    if (isLoading && items.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-sky-800 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-100 text-sky-600">
                {icon}
              </span>
              {title}
            </h2>
            <button 
              className="text-xs font-medium text-sky-600 hover:underline"
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
            <h2 className="text-sm font-semibold text-sky-800 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-100 text-sky-600">
                {icon}
              </span>
              {title}
            </h2>
            <button 
              className="text-xs font-medium text-sky-600 hover:underline"
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
  const stateElement = renderState(loading, error, projects, 'Recent Projects', <Folder size={16} />, '/projects');
  if (stateElement) {
    return stateElement;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-sky-800 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-sky-100 text-sky-600">
            <Folder size={16} />
          </span>
          Recent Projects
        </h2>

        <button 
          className="text-xs font-medium text-sky-600 hover:underline"
          onClick={() => navigate('/projects')}
        >
          View all
        </button>
      </div>

      {/* Project List */}
      <ul className="space-y-3">
        {projects.map((project) => (
          <li
            key={project.id}
            className="p-3 rounded-lg hover:bg-sky-50 transition cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sky-900 text-sm truncate">
                  {project.name}
                </h3>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <User size={12} className="mr-1" />
                    {project.teamMembers}
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        project.progress === 100 
                          ? "bg-green-500" 
                          : project.progress > 75 
                            ? "bg-blue-500" 
                            : project.progress > 50 
                              ? "bg-sky-500" 
                              : project.progress > 25 
                                ? "bg-amber-500" 
                                : "bg-gray-400"
                      }`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 ml-2 flex flex-col items-end">
                <span>{project.lastUpdated}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentProjects;