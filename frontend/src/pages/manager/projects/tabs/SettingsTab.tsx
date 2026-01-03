import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Save,
  AlertTriangle,
} from "lucide-react";
import { projectApi } from "@/services/api/projectApi";
import { Project } from "@/services/api/types";

// Mock UI components - these should be imported from your component library
const Section = ({ title, icon, danger, children }: { title: string; icon: React.ReactNode; danger?: boolean; children: React.ReactNode }) => (
  <div className={`p-4 rounded-lg border ${danger ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 className="font-semibold">{title}</h3>
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

const Input = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded px-3 py-2"
    />
  </div>
);

const Textarea = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded px-3 py-2"
      rows={3}
    />
  </div>
);

const Select = ({ 
  label, 
  value, 
  onChange, 
  options 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  options: { value: string; label: string }[] 
}) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded px-3 py-2"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const DangerAction = ({ 
  title, 
  description, 
  action, 
  label, 
  destructive 
}: { 
  title: string; 
  description: string; 
  action: () => void; 
  label: string; 
  destructive?: boolean; 
}) => (
  <div className="flex justify-between items-start p-3 border border-gray-200 rounded">
    <div className="flex-1">
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
    <button
      onClick={action}
      className={`px-3 py-1.5 rounded text-sm ${destructive ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}
    >
      {label}
    </button>
  </div>
);

const ConfirmModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText, 
  confirmInput 
}: { 
  open: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  description: string; 
  confirmText: string; 
  confirmInput?: {
    value: string;
    onChange: (value: string) => void;
    mustMatch: string;
  };
}) => {
  if (!open) return null;

  const isConfirmed =
    !!confirmInput &&
    confirmInput.mustMatch.length > 0 &&
    confirmInput.value === confirmInput.mustMatch;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        
        {confirmInput && (
          <div className="mb-4">
            <input
              type="text"
              value={confirmInput.value}
              onChange={(e) => confirmInput.onChange(e.target.value)}
              placeholder={`Type "${confirmInput.mustMatch}" to confirm`}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
            />
            {!isConfirmed && (
              <p className="text-red-500 text-sm">Text must match exactly</p>
            )}
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed}
            className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   TYPES & PERMISSIONS
====================================================== */

type Visibility = "private" | "team" | "public";
type Role = "owner" | "admin" | "manager" | "member";

const canManageProject = (role: Role) =>
  role === "owner" || role === "admin";

/* ======================================================
   COMPONENT
====================================================== */

const SettingsTab = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* ---- TEMP: replace with auth state ---- */
  const currentUserRole: Role = "owner";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [project, setProject] = useState<Project | null>(null);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    visibility: Visibility;
  }>({
    name: "",
    description: "",
    visibility: "private",
  });

  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  /* ===============================
      FETCH
  =============================== */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const p = await projectApi.getProjectById(+id);
        setProject(p);
        setForm({
          name: p.name,
          description: p.description ?? "",
          visibility: "private", // Default visibility since Project type doesn't have this field
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* ===============================
      ACTIONS
  =============================== */
  const saveChanges = async () => {
    try {
      setSaving(true);
      // await projectApi.updateProject(+id!, form);
      if (project) {
        setProject({ ...project, ...form });
      }
    } finally {
      setSaving(false);
    }
  };

  const archiveProject = async () => {
    // In a real implementation, this would call the API to archive the project
    // await projectApi.updateProject(+id!, { ...project, status: 'archived' });
    navigate("/projects");
  };

  const deleteProject = async () => {
    // In a real implementation, this would call the API to delete the project
    // await projectApi.deleteProject(+id!);
    navigate("/projects");
  };

  /* ===============================
      LOADING
  =============================== */
  if (loading) {
    return (
      <div className="flex justify-center py-20 text-gray-500">
        Loading settings…
      </div>
    );
  }

  /* ===============================
      UI
  =============================== */
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Project Settings</h2>

      {/* BASIC SETTINGS */}
      <Section title="Configuration" icon={<Settings />}>
        <Input
          label="Project Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />

        <Select
          label="Visibility"
          value={form.visibility}
          onChange={(v) =>
            setForm({ ...form, visibility: v as Visibility })
          }
          options={[
            { value: "private", label: "Private" },
            { value: "team", label: "Team" },
            { value: "public", label: "Public" },
          ]}
        />

        {canManageProject(currentUserRole) && (
          <div className="flex justify-end">
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </Section>

      {/* DANGER ZONE */}
      {canManageProject(currentUserRole) && (
        <Section
          title="Danger Zone"
          icon={<AlertTriangle />}
          danger
        >
          <DangerAction
            title="Archive Project"
            description="You can restore it later."
            action={() => setConfirmArchive(true)}
            label="Archive"
          />

          <DangerAction
            title="Delete Project"
            description="This action is permanent."
            action={() => setConfirmDelete(true)}
            label="Delete"
            destructive
          />
        </Section>
      )}

      {/* ARCHIVE CONFIRM */}
      <ConfirmModal
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={archiveProject}
        title="Archive Project?"
        description="The project will be hidden but recoverable."
        confirmText="Archive"
      />

      {/* DELETE CONFIRM */}
      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteProject}
        title="Delete Project"
        description={`Type "${project?.name || ''}" to confirm deletion.`}
        confirmText="Delete"
        confirmInput={{
          value: deleteInput,
          onChange: setDeleteInput,
          mustMatch: project?.name || '',
        }}
      />
    </div>
  );
};

export default SettingsTab;
