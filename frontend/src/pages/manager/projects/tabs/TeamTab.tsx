import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  MoreVertical,
  XCircle,
  User as UserIcon,
} from "lucide-react";

import { projectApi } from "@/services/api/projectApi";
import { User } from "@/services/api/types";

/* ======================================================
   ROLE SYSTEM
====================================================== */

export type TeamMemberRole = "owner" | "admin" | "manager" | "member";

/**
 * Role hierarchy:
 * owner/admin → manage team + access
 * manager     → manage work, NOT access
 * member      → execution only
 */
const canManageTeam = (role?: TeamMemberRole) =>
  role === "owner" || role === "admin";

/* ======================================================
   TYPES
====================================================== */

interface TeamMember extends User {
  role: TeamMemberRole;
}

/* ======================================================
   UI CONSTANTS
====================================================== */

const ROLE_COLOR: Record<TeamMemberRole, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  manager: "bg-gray-100 text-gray-700",
  member: "bg-green-100 text-green-700",
};

/* ======================================================
   NORMALIZATION
====================================================== */

const normalizeTeam = (data: User[]): TeamMember[] =>
  data.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u.role ?? "member") as TeamMemberRole,
  }));

/* ======================================================
   COMPONENT
====================================================== */

const TeamTab = () => {
  const { id } = useParams<{ id: string }>();

  /* -------------------- STATE -------------------- */
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMemberRole>("member");

  /** TODO: Replace with auth context */
  const currentUserRole: TeamMemberRole = "owner";

  /* -------------------- FETCH -------------------- */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const data = await projectApi.getProjectTeam(+id);
        setMembers(normalizeTeam(data));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* -------------------- FILTER -------------------- */
  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.role.includes(q)
    );
  }, [members, search]);

  /* -------------------- MOCK ACTIONS --------------------
     (Safe placeholders – replace with API later)
  ------------------------------------------------------ */

  const addMemberMock = () => {
    if (!email) return;

    setMembers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "New Member",
        email,
        role,
      },
    ]);

    setEmail("");
    setRole("member");
    setShowAdd(false);
  };

  const removeMemberMock = (member: TeamMember) => {
    if (member.role === "owner") return;

    const ok = confirm(`Remove ${member.name} from this project?`);
    if (!ok) return;

    setMembers((prev) => prev.filter((m) => m.id !== member.id));
  };

  /* -------------------- LOADING -------------------- */
  if (loading) {
    return (
      <div className="flex justify-center py-20 text-gray-500">
        Loading team…
      </div>
    );
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Project Team
          </h2>
          <p className="text-sm text-gray-500">
            Manage access, roles, and responsibilities
          </p>
        </div>

        {canManageTeam(currentUserRole) && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, role"
          className="pl-9 pr-3 py-2 w-full border rounded-lg"
        />
      </div>

      {/* TEAM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredMembers.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white border rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{member.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {member.email}
                  </p>
                </div>

                <MoreVertical className="w-4 h-4 text-gray-400" />
              </div>

              <div className="flex justify-between items-center">
                {/* ROLE CONTROL */}
                {canManageTeam(currentUserRole) && member.role !== "owner" ? (
                  <select
                    value={member.role}
                    onChange={(e) => {
                      const newRole = e.target.value as TeamMemberRole;
                      setMembers((prev) =>
                        prev.map((m) =>
                          m.id === member.id ? { ...m, role: newRole } : m
                        )
                      );
                    }}
                    className="text-xs border rounded px-2 py-1"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${ROLE_COLOR[member.role]}`}
                  >
                    {member.role.toUpperCase()}
                  </span>
                )}

                {/* REMOVE */}
                {canManageTeam(currentUserRole) &&
                  member.role !== "owner" && (
                    <button
                      onClick={() => removeMemberMock(member)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ADD MEMBER MODAL */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="font-semibold text-lg mb-4">
                Add Team Member
              </h3>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full border px-3 py-2 rounded mb-3"
              />

              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as TeamMemberRole)
                }
                className="w-full border px-3 py-2 rounded mb-4"
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={addMemberMock}
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  Add
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamTab;