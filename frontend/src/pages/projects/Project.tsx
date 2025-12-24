import { useState, useEffect } from "react";
import { 
  Folder, 
  Search, 
  Plus, 
  Calendar,
  User,
  Filter,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import { Project as ProjectType } from "../../services/api/types";
// import { projectApi } from "../../services/api"; // Commented out since using mock data

const Project = () => {
  const [allProjects, setAllProjects] = useState<ProjectType[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



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

  // Use mock data instead of API call
  useEffect(() => {
    const mockProjects = [
      {
        id: 1,
        name: "Website Redesign",
        status: "active",
        description: "Complete redesign of the company website with modern UI/UX.",
        teamMembers: 5,
        progress: 75,
        lastUpdated: "2 hours ago",
      },
      {
        id: 2,
        name: "Mobile App Development",
        status: "in progress",
        description: "Building a cross-platform mobile application for iOS and Android.",
        teamMembers: 8,
        progress: 45,
        lastUpdated: "1 day ago",
      },
      {
        id: 3,
        name: "Database Migration",
        status: "completed",
        description: "Migrating legacy database to new cloud infrastructure.",
        teamMembers: 3,
        progress: 100,
        lastUpdated: "3 days ago",
      },
      {
        id: 4,
        name: "API Integration",
        status: "upcoming",
        description: "Integrating third-party services with our existing platform.",
        teamMembers: 4,
        progress: 0,
        lastUpdated: "1 week ago",
      },
      {
        id: 5,
        name: "Security Audit",
        status: "delayed",
        description: "Comprehensive security audit of all systems and applications.",
        teamMembers: 2,
        progress: 10,
        lastUpdated: "2 weeks ago",
      },
      {
        id: 6,
        name: "Marketing Campaign",
        status: "active",
        description: "Launch new marketing campaign for Q4.",
        teamMembers: 6,
        progress: 60,
        lastUpdated: "5 hours ago",
      },
    ];
    
    try {
      setLoading(true);
      setAllProjects(mockProjects);
      setFilteredProjects(mockProjects);
      setError(null);
    } catch (err) {
      console.error('Error loading mock projects:', err);
      setError('Failed to load projects. Using mock data failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter projects based on search term and status
  useEffect(() => {
    let result = allProjects;

    if (searchTerm) {
      result = result.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(project => 
        project.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredProjects(result);
  }, [searchTerm, statusFilter, allProjects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Projects
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and track all your projects in one place
            </p>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
              <Plus size={16} />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-400 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="upcoming">Upcoming</option>
                <option value="delayed">Delayed</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
              />
            </div>
            
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter size={16} />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Folder size={18} className="text-sky-600" />
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {project.name}
                  </h3>
                </div>
                
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <User size={12} className="mr-1" />
                    {project.teamMembers}
                  </div>
                </div>
                
                <div className="mb-3">
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
                  <div className="text-xs text-gray-500 mt-1">
                    {project.progress}% complete
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 flex items-center">
                  <Calendar size={12} className="mr-1" />
                  Updated {project.lastUpdated}
                </div>
              </div>
              
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreHorizontal size={16} className="text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Folder size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
        </div>
      )}
    </div>
  );
};

export default Project;