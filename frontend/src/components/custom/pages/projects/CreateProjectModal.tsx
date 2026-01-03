import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { projectApi } from "@/services/api/projectApi";
import toast from "react-hot-toast";
import { ProjectFormData } from "./ProjectForm";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: ProjectFormData) => {
    try {
      setIsSubmitting(true);
      const result = await projectApi.createProject(formData);
      console.log("Project created successfully:", result);
      toast.success("Project created successfully!");
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error("Error creating project:", err);
      
      let errorMessage = "Failed to create project";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        if ('response' in err && typeof err.response === 'object' && err.response !== null) {
          const response = err.response as any;
          if (response.data?.message) {
            errorMessage = response.data.message;
          } else if (response.statusText) {
            errorMessage = response.statusText;
          }
        } else if ('message' in err) {
          errorMessage = (err as any).message;
        }
      }
      
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - No blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Modal - Fixed position, doesn't move on scroll */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] p-4 sm:p-0"
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
                  <p className="text-sm text-gray-600 mt-1">Fill in the details to create a new project</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </motion.button>
              </div>

              {/* Form Content */}
              <div className="p-6">
                <ProjectFormModal
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                  isSubmitting={isSubmitting}
                />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Simplified form for modal (without accordion sections)
interface ProjectFormModalProps {
  onSubmit: (formData: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [project, setProject] = useState<ProjectFormData>({
    name: "",
    description: "",
    status: "active", // Default to active for new projects
    start_date: "",
    end_date: "",
    organization_id: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setProject((prev) => ({
      ...prev,
      [name]: name === "organization_id" ? parseInt(value) || 1 : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (submitError) {
      setSubmitError(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!project.name.trim()) {
      newErrors.name = "Project name is required";
    }

    if (!project.description.trim()) {
      newErrors.description = "Project description is required";
    }

    if (!project.start_date) {
      newErrors.start_date = "Start date is required";
    }

    if (!project.end_date) {
      newErrors.end_date = "End date is required";
    } else if (project.start_date && project.end_date < project.start_date) {
      newErrors.end_date = "End date must be after start date";
    }

    if (!project.organization_id) {
      newErrors.organization_id = "Organization is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitError(null);

    try {
      await onSubmit(project);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit project";
      setSubmitError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Name *
        </label>
        <input
          type="text"
          name="name"
          value={project.name}
          onChange={handleInputChange}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter project name (e.g., ERP System)"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          name="description"
          value={project.description}
          onChange={handleInputChange}
          rows={3}
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.description ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Describe your project..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.description}
          </p>
        )}
      </div>

      {/* Dates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            name="start_date"
            value={project.start_date}
            onChange={handleInputChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.start_date ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.start_date}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            name="end_date"
            value={project.end_date}
            onChange={handleInputChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.end_date ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.end_date}
            </p>
          )}
        </div>
      </div>

      {/* Status & Organization Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={project.status}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={true} // Status field is disabled during project creation
          >
            <option value="inactive">Inactive</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="delayed">Delayed</option>
            <option value="completed">Completed</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Status defaults to 'Active' and can be changed later in settings
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization ID *
          </label>
          <input
            type="number"
            name="organization_id"
            value={project.organization_id}
            onChange={handleInputChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.organization_id ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="1"
            min="1"
          />
          {errors.organization_id && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.organization_id}
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{submitError}</span>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Cancel
        </button>
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Project"
          )}
        </motion.button>
      </div>
    </form>
  );
};

export default CreateProjectModal;
