import axios from "axios";
import { ApiResponse } from "./types";

/* ======================================================
   🔹 AXIOS INSTANCE
====================================================== */

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  withCredentials: true,
});

/* ======================================================
   🔹 REQUEST INTERCEPTOR (AUTH)
====================================================== */

apiClient.interceptors.request.use((config) => {
  let token: string | null = null;

  try {
    const authState = localStorage.getItem("authState");
    if (authState) {
      token = JSON.parse(authState)?.token;
    }
  } catch {
    token = null;
  }

  if (!token) {
    token = localStorage.getItem("access_token");
  }

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

/* ======================================================
   🔹 RESPONSE INTERCEPTOR (TOKEN EXPIRY)
====================================================== */

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authState");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ======================================================
   🔹 ATTACHMENT TYPES
====================================================== */

export interface Attachment {
  id: number;
  issue_id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  uploaded_by: number;
  uploader_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AttachmentListResponse {
  success: boolean;
  message: string;
  data: Attachment[];
  count: number;
}

export interface AttachmentUploadResponse {
  success: boolean;
  message: string;
  data: Attachment;
}

/* ======================================================
   🔹 ATTACHMENT API
====================================================== */

export const attachmentApi = {
  /**
   * Get all attachments for an issue
   */
  getByIssue: async (issueId: number): Promise<Attachment[]> => {
    try {
      const res = await apiClient.get<AttachmentListResponse>(
        `/attachment/issue/${issueId}`
      );
      return res.data.data || [];
    } catch (error: any) {
      console.error("Error fetching attachments:", error);
      throw error;
    }
  },

  /**
   * Upload an attachment to an issue
   */
  upload: async (issueId: number, file: File): Promise<Attachment> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.post<AttachmentUploadResponse>(
        `/attachment/issue/${issueId}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data.data;
    } catch (error: any) {
      console.error("Error uploading attachment:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to upload file";
      throw new Error(errorMessage);
    }
  },

  /**
   * Get attachment by ID
   */
  getById: async (attachmentId: number): Promise<Attachment> => {
    try {
      const res = await apiClient.get<ApiResponse<Attachment>>(
        `/attachment/${attachmentId}`
      );
      return res.data.data;
    } catch (error: any) {
      console.error("Error fetching attachment:", error);
      throw error;
    }
  },

  /**
   * Delete an attachment
   */
  delete: async (attachmentId: number): Promise<void> => {
    try {
      await apiClient.delete(`/attachment/${attachmentId}`);
    } catch (error: any) {
      console.error("Error deleting attachment:", error);
      throw error;
    }
  },

  /**
   * Download an attachment
   */
  download: async (attachmentId: number, fileName: string): Promise<void> => {
    try {
      const attachment = await attachmentApi.getById(attachmentId);
      
      if (!attachment || !attachment.file_url) {
        throw new Error("Attachment URL not found");
      }
      
      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = attachment.file_url;
      link.download = fileName || attachment.file_name || "download";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Error downloading attachment:", error);
      const errorMessage = error.message || "Failed to download file";
      throw new Error(errorMessage);
    }
  },
};
