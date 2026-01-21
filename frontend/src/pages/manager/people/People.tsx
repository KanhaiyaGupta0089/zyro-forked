import { useState, useEffect, useMemo, useCallback, forwardRef } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Shield,
  UserCheck,
  Loader2,
  AlertCircle,
  Filter,
  X,
} from "lucide-react";
import { userApi } from "../../../services/api/userApi";
import CreateUserModal from "./CreateUserModal";
import EditUserModal from "./EditUserModal";
import DeleteUserModal from "./DeleteUserModal";
import toast from "react-hot-toast";
import { RootState } from "../../../redux/store";

/* ======================================================
   Types
====================================================== */

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  story_point?: number;
  organization_id?: number;
  created_at?: string;
  updated_at?: string;
}

/* ======================================================
   Helper Functions
====================================================== */

const getRoleBadge = (role: string): { bg: string; text: string; icon: React.ElementType } => {
  switch (role?.toLowerCase()) {
    case "admin":
      return {
        bg: "bg-[#FFEBE6] text-[#BF2600]",
        text: "Admin",
        icon: Shield,
      };
    case "manager":
      return {
        bg: "bg-[#DEEBFF] text-[#0052CC]",
        text: "Manager",
        icon: UserCheck,
      };
    case "employee":
      return {
        bg: "bg-[#E3FCEF] text-[#006644]",
        text: "Employee",
        icon: Users,
      };
    default:
      return {
        bg: "bg-[#F4F5F7] text-[#42526E]",
        text: role || "Unknown",
        icon: Users,
      };
  }
};

const getStatusBadge = (status: string): { bg: string; text: string } => {
  switch (status?.toLowerCase()) {
    case "active":
      return { bg: "bg-[#E3FCEF] text-[#006644]", text: "Active" };
    case "invited":
      return { bg: "bg-[#FFF4E6] text-[#974F00]", text: "Invited" };
    case "inactive":
      return { bg: "bg-[#F4F5F7] text-[#42526E]", text: "Inactive" };
    case "blocked":
      return { bg: "bg-[#FFEBE6] text-[#BF2600]", text: "Blocked" };
    default:
      return { bg: "bg-[#F4F5F7] text-[#42526E]", text: status || "Unknown" };
  }
};

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0][0]?.toUpperCase() ?? "";
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-cyan-500",
    "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/* ======================================================
   User Card Component
====================================================== */

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const UserCard = forwardRef<HTMLDivElement, UserCardProps>(({ user, onEdit, onDelete }, ref) => {
  const roleBadge = getRoleBadge(user.role);
  const statusBadge = getStatusBadge(user.status);
  const RoleIcon = roleBadge.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-[#DFE1E6] rounded-lg p-5 hover:border-[#0052CC] hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-4">
        {/* Avatar & Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`w-12 h-12 rounded-full ${getAvatarColor(user.name)} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}
          >
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[#172B4D] truncate group-hover:text-[#0052CC] transition-colors">
              {user.name}
            </h3>
            <p className="text-sm text-[#6B778C] truncate flex items-center gap-1 mt-0.5">
              <Mail size={12} />
              {user.email}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(user)}
            className="p-2 rounded-lg hover:bg-[#F4F5F7] text-[#6B778C] hover:text-[#0052CC] transition-colors"
            title="Edit user"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-2 rounded-lg hover:bg-[#FFEBE6] text-[#6B778C] hover:text-[#DE350B] transition-colors"
            title="Delete user"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${roleBadge.bg}`}
        >
          <RoleIcon size={12} />
          {roleBadge.text}
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${statusBadge.bg}`}
        >
          {statusBadge.text}
        </span>
        {user.story_point !== undefined && user.story_point > 0 && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F4F5FF] text-[#6554C0]">
            {user.story_point} SP
          </span>
        )}
      </div>
    </motion.div>
  );
});
UserCard.displayName = "UserCard";

/* ======================================================
   Main People Component
====================================================== */

const People = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getUsers();
      setUsers(data || []);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Failed to load users");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role?.toLowerCase() === roleFilter.toLowerCase();
      const matchesStatus =
        statusFilter === "all" || user.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Handle create
  const handleCreate = async (userData: { 
    name: string; 
    email: string; 
    role: string; 
    organization_id: number;
    approving_manager_id?: number;
    reporting_manager_id?: number;
  }) => {
    try {
      await userApi.createUser(userData);
      toast.success("User invited successfully!");
      setShowCreateModal(false);
      fetchUsers();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to create user";
      toast.error(errorMsg);
      throw err;
    }
  };

  // Handle delete
  const handleDelete = async (userId: number) => {
    try {
      await userApi.deleteUser(userId);
      toast.success("User deleted successfully!");
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to delete user";
      toast.error(errorMsg);
    }
  };

  // Get unique roles and statuses for filters
  const uniqueRoles = useMemo(() => {
    const roles = new Set(users.map((u) => u.role?.toLowerCase()).filter(Boolean));
    return Array.from(roles);
  }, [users]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(users.map((u) => u.status?.toLowerCase()).filter(Boolean));
    return Array.from(statuses);
  }, [users]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D]">People</h1>
            <p className="text-sm text-[#6B778C] mt-1">Manage your team members</p>
          </div>
          {currentUser?.role === "admin" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0052CC] to-[#0065FF] text-white rounded-lg hover:from-[#0065FF] hover:to-[#0052CC] transition-all font-semibold shadow-md hover:shadow-lg"
            >
              <Plus size={18} />
              Invite User
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]"
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#DFE1E6] rounded-lg focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] bg-white text-[#172B4D] text-sm"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C] pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-[#DFE1E6] rounded-lg focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] bg-white text-[#172B4D] text-sm appearance-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-8 py-2.5 border border-[#DFE1E6] rounded-lg focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] bg-white text-[#172B4D] text-sm appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#DFE1E6] rounded-lg hover:bg-[#F4F5F7] text-[#6B778C] text-sm font-medium transition-colors"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-[#C1C7D0]
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:hover:bg-[#A5ADBA]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#6B778C]">
            <Loader2 size={32} className="animate-spin mb-4 text-[#0052CC]" />
            <p className="text-sm font-medium">Loading users...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#DE350B]">
            <AlertCircle size={32} className="mb-4" />
            <p className="text-sm font-semibold mb-2">Failed to load users</p>
            <p className="text-xs text-[#6B778C] mb-4">{error}</p>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-[#0052CC] text-white rounded-lg hover:bg-[#0065FF] transition-colors text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#6B778C]">
            <Users size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-semibold mb-1">
              {users.length === 0 ? "No users found" : "No users match your filters"}
            </p>
            <p className="text-xs">
              {users.length === 0
                ? "Get started by inviting your first team member"
                : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={setEditingUser}
                  onDelete={setDeletingUser}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />

      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdate={fetchUsers}
        />
      )}

      {deletingUser && (
        <DeleteUserModal
          isOpen={!!deletingUser}
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default People;

