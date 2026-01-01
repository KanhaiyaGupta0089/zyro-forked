import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Plus,
  MoreVertical
} from "lucide-react";
import { projectApi } from "@/services/api/projectApi";

const TimelineTab = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectRes = await projectApi.getProjectById(Number(id));
        setProject(projectRes);
        
        // In the future, fetch real milestones from an API endpoint like:
        // const milestonesRes = await projectApi.getProjectMilestones(Number(id));
        // For now, we'll create milestones based on project dates
        const projectMilestones = [
          { 
            id: 1, 
            name: "Project Start", 
            date: projectRes.start_date, 
            status: new Date(projectRes.start_date) <= new Date() ? "completed" : "upcoming", 
            description: "Project officially started" 
          },
          { 
            id: 2, 
            name: "Midpoint", 
            date: new Date(
              new Date(projectRes.start_date).getTime() + 
              (new Date(projectRes.end_date).getTime() - new Date(projectRes.start_date).getTime()) / 2
            ).toISOString().split('T')[0],
            status: new Date() > new Date(
              new Date(projectRes.start_date).getTime() + 
              (new Date(projectRes.end_date).getTime() - new Date(projectRes.start_date).getTime()) / 2
            ) ? "completed" : "upcoming", 
            description: "Project midpoint reached" 
          },
          { 
            id: 3, 
            name: "Project End", 
            date: projectRes.end_date, 
            status: new Date(projectRes.end_date) < new Date() ? "completed" : "upcoming", 
            description: "Project completion" 
          },
        ];
        
        setMilestones(projectMilestones);
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
        <p className="text-gray-600 text-center">Loading timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Timeline</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
          <Plus size={18} />
          <span>Add Milestone</span>
        </button>
      </div>

      {/* Project Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="text-xl font-bold text-gray-800">
                {project?.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">End Date</p>
              <p className="text-xl font-bold text-gray-800">
                {project?.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Milestones Timeline */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Project Milestones</h3>
        
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 transform -translate-x-1/2"></div>
          
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative pl-12"
              >
                {/* Timeline dot */}
                <div className={`absolute left-0 top-2 w-8 h-8 rounded-full flex items-center justify-center ${
                  milestone.status === 'completed' ? 'bg-green-500 text-white' :
                  milestone.status === 'in-progress' ? 'bg-blue-500 text-white animate-pulse' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {milestone.status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                   milestone.status === 'in-progress' ? <Clock className="w-4 h-4" /> :
                   <Clock className="w-4 h-4" />}
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{milestone.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(milestone.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                        milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {milestone.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                         milestone.status === 'in-progress' ? <Clock className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {milestone.status === 'completed' ? 'Completed' :
                         milestone.status === 'in-progress' ? 'In Progress' :
                         'Upcoming'}
                      </span>
                      
                      <button className="p-1 rounded hover:bg-gray-100">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineTab;