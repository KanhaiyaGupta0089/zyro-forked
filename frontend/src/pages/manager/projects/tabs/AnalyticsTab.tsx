import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  Activity
} from "lucide-react";
import { projectApi } from "@/services/api/projectApi";
import { issueApi } from "@/services/api/issueApi";

const AnalyticsTab = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectRes = await projectApi.getProjectById(Number(id));
        setProject(projectRes);
        
        // Get issues for this project using the dedicated API endpoint
        const projectIssues = await issueApi.getIssuesByProject(Number(id));
        setIssues(projectIssues);
        
        // Calculate analytics data
        const totalIssues = projectIssues.length;
        const completedIssues = projectIssues.filter((issue: any) => 
          issue.status?.toLowerCase() === 'completed' || 
          issue.status?.toLowerCase() === 'closed'
        ).length;
        const openIssues = projectIssues.filter((issue: any) => 
          issue.status?.toLowerCase() === 'open' || 
          issue.status?.toLowerCase() === 'todo'
        ).length;
        const inProgressIssues = projectIssues.filter((issue: any) => 
          issue.status?.toLowerCase() === 'in progress' || 
          issue.status?.toLowerCase() === 'in-progress'
        ).length;
        const overdueIssues = projectIssues.filter((issue: any) => {
          // Check if issue is overdue by comparing due date with current date
          if (!issue.due_date) return false;
          return new Date(issue.due_date) < new Date() && 
                 issue.status?.toLowerCase() !== 'completed' && 
                 issue.status?.toLowerCase() !== 'closed';
        }).length;
        
        const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
        
        // Calculate additional metrics
        const priorityBreakdown = {
          high: projectIssues.filter((issue: any) => issue.priority?.toLowerCase() === 'high' || issue.priority?.toLowerCase() === 'critical').length,
          medium: projectIssues.filter((issue: any) => issue.priority?.toLowerCase() === 'medium' || issue.priority?.toLowerCase() === 'moderate').length,
          low: projectIssues.filter((issue: any) => issue.priority?.toLowerCase() === 'low').length,
        };
        
        setAnalyticsData({
          totalIssues,
          completedIssues,
          openIssues,
          inProgressIssues,
          overdueIssues,
          completionRate,
          priorityBreakdown,
          teamSize: projectRes.teamMembers || 1 // Using project's team members if available
        });
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
        <p className="text-gray-600 text-center">Loading analytics...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-500 text-center">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Issues</p>
              <p className="text-xl font-bold text-gray-800">{analyticsData.totalIssues}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-800">{analyticsData.completedIssues}</p>
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
            <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-xl font-bold text-gray-800">{analyticsData.inProgressIssues}</p>
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
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-xl font-bold text-gray-800">{analyticsData.overdueIssues}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Completion Rate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Project Completion</h3>
          <span className="text-2xl font-bold text-sky-600">{analyticsData.completionRate}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${analyticsData.completionRate}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-4 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full"
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>{analyticsData.completedIssues} completed</span>
          <span>{analyticsData.totalIssues - analyticsData.completedIssues} remaining</span>
        </div>
      </motion.div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Performance</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Team Size</span>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{analyticsData.teamSize}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg. Resolution Time</span>
              <span className="font-medium">5 days</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Issues per Member</span>
              <span className="font-medium">
                {analyticsData.teamSize > 0 ? Math.round(analyticsData.totalIssues / analyticsData.teamSize) : 0}
              </span>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Issue Distribution</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">High Priority</span>
              <span className="font-medium">{analyticsData.priorityBreakdown?.high || 0}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Medium Priority</span>
              <span className="font-medium">{analyticsData.priorityBreakdown?.medium || 0}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Low Priority</span>
              <span className="font-medium">{analyticsData.priorityBreakdown?.low || 0}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">Project completion rate increased to 75%</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">New issue created in project</p>
              <p className="text-xs text-gray-500">Yesterday</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">Milestone completed: Development Phase</p>
              <p className="text-xs text-gray-500">2 days ago</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsTab;