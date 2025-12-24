import { useState, useEffect } from "react";
import { 
  Bug, 
  Search, 
  Plus, 
  Calendar,
  User,
  Filter,
  ChevronDown,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { Issue as IssueType } from "../../services/api/types";
// import { issueApi } from "../../services/api"; // Commented out since using mock data

const Issue = () => {
  const [allIssues, setAllIssues] = useState<IssueType[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<IssueType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  // Function to get status color based on status
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border border-green-200";
      case "hold":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "to do":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "in progress":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "canceled":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // Function to get priority color based on priority
  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // Function to get type icon based on issue type
  const getTypeIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case "bug":
        return <AlertTriangle size={14} />;
      case "feature":
        return <CheckCircle size={14} />;
      case "task":
        return <Clock size={14} />;
      default:
        return <Bug size={14} />;
    }
  };

  // Use mock data instead of API call
  useEffect(() => {
    const mockIssues = [
      {
        id: 1,
        title: "Fix Login Page Error",
        type: "bug",
        status: "in progress",
        priority: "high",
        description: "Users are unable to login with valid credentials. Error occurs after password validation.",
        assignee: "John Smith",
        project: "Website Redesign",
        created: "2 hours ago",
      },
      {
        id: 2,
        title: "Add Dark Mode Feature",
        type: "feature",
        status: "to do",
        priority: "medium",
        description: "Implement dark mode toggle in user preferences section.",
        assignee: "Unassigned",
        project: "Mobile App",
        created: "1 day ago",
      },
      {
        id: 3,
        title: "Update Documentation",
        type: "task",
        status: "completed",
        priority: "low",
        description: "Update API documentation with new endpoints and parameters.",
        assignee: "Emily Johnson",
        project: "API Integration",
        created: "3 days ago",
      },
      {
        id: 4,
        title: "Database Performance Issue",
        type: "bug",
        status: "hold",
        priority: "high",
        description: "Slow query response times affecting user experience. Requires investigation.",
        assignee: "Michael Brown",
        project: "Database Migration",
        created: "1 week ago",
      },
      {
        id: 5,
        title: "Mobile Responsive Issues",
        type: "bug",
        status: "in progress",
        priority: "medium",
        description: "Layout breaks on mobile devices below 768px width.",
        assignee: "Sarah Davis",
        project: "Website Redesign",
        created: "5 hours ago",
      },
      {
        id: 6,
        title: "Implement Payment Gateway",
        type: "feature",
        status: "to do",
        priority: "high",
        description: "Integrate Stripe payment processing for subscription plans.",
        assignee: "Unassigned",
        project: "E-commerce Platform",
        created: "2 days ago",
      },
    ];
    
    try {
      setLoading(true);
      setAllIssues(mockIssues);
      setFilteredIssues(mockIssues);
      setError(null);
    } catch (err) {
      console.error('Error loading mock issues:', err);
      setError('Failed to load issues. Using mock data failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter issues based on search term, status, and priority
  useEffect(() => {
    let result = allIssues;

    if (searchTerm) {
      result = result.filter(issue => 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.project.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(issue => 
        issue.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (priorityFilter !== "all") {
      result = result.filter(issue => 
        issue.priority.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    setFilteredIssues(result);
  }, [searchTerm, statusFilter, priorityFilter, allIssues]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Loading issues...</div>
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
              Issues
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track and manage all project issues
            </p>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
              <Plus size={16} />
              New Issue
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Search issues..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="hold">Hold</option>
                <option value="to do">To Do</option>
                <option value="in progress">In Progress</option>
                <option value="canceled">Canceled</option>
              </select>
              <ChevronDown 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
              />
            </div>
            
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <ChevronDown 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
              />
            </div>
            
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter size={16} />
              <span className="hidden sm:inline text-sm">Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.map((issue) => (
          <div
            key={issue.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-1.5 rounded bg-blue-100 text-blue-600">
                    {getTypeIcon(issue.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {issue.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>
                            
                    <p className="text-xs text-gray-600 mt-1">
                      {issue.description}
                    </p>
                  </div>
                </div>
                        
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                          
                  <div className="text-xs text-gray-500 flex items-center">
                    <User size={10} className="mr-1" />
                    {issue.assignee}
                  </div>
                          
                  <div className="text-xs text-gray-500">
                    {issue.project}
                  </div>
                          
                  <div className="text-xs text-gray-500 flex items-center">
                    <Calendar size={10} className="mr-1" />
                    {issue.created}
                  </div>
                </div>
              </div>
                      
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreHorizontal size={16} className="text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredIssues.length === 0 && (
        <div className="text-center py-12">
          <Bug size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
          <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
        </div>
      )}
    </div>
  );
};

export default Issue;