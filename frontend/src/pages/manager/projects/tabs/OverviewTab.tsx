import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Folder, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users,
  Calendar as CalendarIcon
} from "lucide-react";
import { projectApi } from "@/services/api/projectApi";
import { issueApi } from "@/services/api/issueApi";

const OverviewTab = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectRes = await projectApi.getProjectById(Number(id));
        setProject(projectRes);
        
        // Get issues for this project using the dedicated API endpoint
        const projectIssues = await issueApi.getIssuesByProject(Number(id));
        setIssues(projectIssues);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mb-4"
        />
        <p className="text-gray-600 text-center">Loading project overview...</p>
      </div>
    );
  }

  // Calculate stats
  const totalIssues = issues.length;
  const completedIssues = issues.filter((issue: any) => issue.status?.toLowerCase() === 'completed').length;
  const pendingIssues = issues.filter((issue: any) => 
    issue.status?.toLowerCase() !== 'completed' && 
    issue.status?.toLowerCase() !== 'closed'
  ).length;
  const teamSize = project?.teamMembers || 1; // Assuming team members count

  return (
    <div className="space-y-6">
      {/* Project Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Project Description</h3>
        <p className="text-gray-600 leading-relaxed">
          {project?.description || 'No description provided for this project.'}
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Issues</p>
              <p className="text-xl font-bold text-gray-800">{totalIssues}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-800">{completedIssues}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-800">{pendingIssues}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Team Size</p>
              <p className="text-xl font-bold text-gray-800">{teamSize}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Project Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Project Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-medium text-gray-800">
                {project?.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">End Date</p>
              <p className="font-medium text-gray-800">
                {project?.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Owner</p>
              <p className="font-medium text-gray-800">{project?.created_by || 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Folder className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Project ID</p>
              <p className="font-medium text-gray-800">{project?.id || 'N/A'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">Project created</p>
              <p className="text-xs text-gray-500">Just now</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">New issue created</p>
              <p className="text-xs text-gray-500">5 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">Issue status updated</p>
              <p className="text-xs text-gray-500">10 minutes ago</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewTab;