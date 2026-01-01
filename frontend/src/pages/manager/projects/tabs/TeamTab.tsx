import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Plus, 
  Search, 
  MoreVertical,
  CheckCircle,
  XCircle
} from "lucide-react";
import { projectApi } from "@/services/api/projectApi";
import { userApi } from "@/services/api/userApi";

const TeamTab = () => {
  const { id } = useParams();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        // Get project details
        const projectRes = await projectApi.getProjectById(Number(id));
        
        // Get all users from the system
        const allUsers = await userApi.getUsers();
        
        // In a real implementation, there would be a specific endpoint to get project team members
        // For now, we'll use all users and mark the project creator as owner
        // and potentially filter based on project_id if user records contain project associations
        
        // Create team members data with the project creator as owner
        let teamMembersData = [];
        
        // Find the project creator in the user list
        const projectCreator = allUsers.find((user: any) => user.id === projectRes.created_by || user.name === projectRes.created_by);
        
        if (projectCreator) {
          teamMembersData.push({
            ...projectCreator,
            role: "owner",
            avatar: projectCreator.avatar || `https://ui-avatars.com/api/?name=${projectCreator.name || 'User'}&background=random`
          });
        }
        
        // Filter other users who might be associated with this project
        // (In a real app, users would have project associations)
        const otherMembers = allUsers
          .filter((user: any) => user.id !== projectRes.created_by && user.name !== projectRes.created_by)
          .slice(0, 3) // Limit to 3 additional members for demo
          .map((user: any, index: number) => ({
            ...user,
            role: index === 0 ? "admin" : "member",
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=random`
          }));
        
        teamMembersData = [...teamMembersData, ...otherMembers];
        
        setTeamMembers(teamMembersData);
        setError(null);
      } catch (err) {
        console.error('Error fetching team:', err);
        setError('Failed to load team members. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id]);

  const filteredTeamMembers = teamMembers.filter(member => {
    return (
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAddMember = () => {
    if (!newMemberEmail) return;
    
    const newMember = {
      id: teamMembers.length + 1,
      name: "New Member",
      email: newMemberEmail,
      role: newMemberRole,
      avatar: "https://via.placeholder.com/40"
    };
    
    setTeamMembers([...teamMembers, newMember]);
    setNewMemberEmail("");
    setShowAddMember(false);
  };

  const handleRemoveMember = (memberId: number) => {
    setTeamMembers(teamMembers.filter(member => member.id !== memberId));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mb-4"
        />
        <p className="text-gray-600 text-center">Loading team members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-12">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
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
      {/* Header with search and add member */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team</h2>
          <p className="text-gray-600">Manage project team members</p>
        </div>
        
        <div className="flex flex-col gap-3 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full sm:w-64"
              />
            </div>
          </div>
          
          <button 
            onClick={() => setShowAddMember(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Member</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
      
      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddMember(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Add Team Member</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Enter member email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                >
                  Add Member
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Team Members List */}
      {filteredTeamMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <User className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No team members found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
          <button 
            onClick={() => setSearchTerm("")}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors w-full sm:w-auto max-w-xs"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredTeamMembers.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{member.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                    member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    member.role === 'viewer' ? 'bg-gray-100 text-gray-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                  
                  {member.role !== 'owner' && (
                    <button 
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1 rounded-lg hover:bg-red-50 text-red-500"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default TeamTab;