import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MoreVertical,
  Calendar as CalendarIcon,
  User
} from "lucide-react";
import { issueApi } from "@/services/api/issueApi";

const IssuesTab = () => {
  const { id } = useParams();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setStatusPriority] = useState("all");

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        // Get issues for this project using the dedicated API endpoint
        const projectIssues = await issueApi.getIssuesByProject(Number(id));
        setIssues(projectIssues);
        setError(null);
      } catch (err) {
        console.error('Error fetching issues:', err);
        setError('Failed to load issues. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [id]);

  // Filter issues based on search term and filters
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || issue.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === "all" || issue.priority?.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mb-4"
        />
        <p className="text-gray-600 text-center">Loading issues...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500 text-center mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors w-full sm:w-auto max-w-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Issues</h2>
          <p className="text-gray-600">Manage issues for this project</p>
        </div>
        
        <div className="flex flex-col gap-3 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full sm:w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setStatusPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full sm:w-auto"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto">
            <Plus size={18} />
            <span className="hidden sm:inline">New Issue</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
      
      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No issues found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
          <button 
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setStatusPriority("all");
            }}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors w-full sm:w-auto max-w-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredIssues.map((issue) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        issue.status?.toLowerCase() === 'open' ? 'bg-blue-100 text-blue-800' :
                        issue.status?.toLowerCase() === 'in progress' ? 'bg-yellow-100 text-yellow-800' :
                        issue.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                        issue.status?.toLowerCase() === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.status?.toLowerCase() === 'open' && <Clock className="w-3 h-3" />}
                        {issue.status?.toLowerCase() === 'in progress' && <Clock className="w-3 h-3" />}
                        {issue.status?.toLowerCase() === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {issue.status?.toLowerCase() === 'closed' && <CheckCircle className="w-3 h-3" />}
                        {issue.status || 'Open'}
                      </span>
                      
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        issue.priority?.toLowerCase() === 'low' ? 'bg-green-100 text-green-800' :
                        issue.priority?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        issue.priority?.toLowerCase() === 'high' ? 'bg-orange-100 text-orange-800' :
                        issue.priority?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.priority || 'Medium'}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 mb-1 truncate">{issue.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{issue.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{issue.assignee || 'Unassigned'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Created: {new Date(issue.created).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default IssuesTab;