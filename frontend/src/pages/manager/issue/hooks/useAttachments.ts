import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { attachmentApi, Attachment } from "@/services/api/attachmentApi";

interface UseAttachmentsOptions {
  issueId?: number | null;
  autoLoad?: boolean;
}

interface UseAttachmentsReturn {
  attachments: Attachment[];
  loading: boolean;
  error: string | null;
  isUploading: boolean;
  uploadAttachment: (file: File) => Promise<void>;
  deleteAttachment: (attachmentId: number) => Promise<void>;
  downloadAttachment: (attachmentId: number, fileName: string) => Promise<void>;
  loadAttachments: () => Promise<void>;
}

export const useAttachments = (
  options: UseAttachmentsOptions = {}
): UseAttachmentsReturn => {
  const { issueId, autoLoad = true } = options;

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState<boolean>(autoLoad && !!issueId);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const loadAttachments = useCallback(async () => {
    if (!issueId) {
      setAttachments([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await attachmentApi.getByIssue(issueId);
      setAttachments(data || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to load attachments";
      setError(errorMessage);
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    if (autoLoad && issueId) {
      loadAttachments();
    }
  }, [autoLoad, issueId, loadAttachments]);

  const uploadAttachment = useCallback(
    async (file: File) => {
      if (!issueId) {
        toast.error("Issue ID is required");
        return;
      }

      try {
        setIsUploading(true);
        setError(null);
        const newAttachment = await attachmentApi.upload(issueId, file);
        setAttachments((prev) => [newAttachment, ...prev]);
        toast.success(`${file.name} uploaded successfully`);
      } catch (err: any) {
        const errorMessage = err.message || "Failed to upload file";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [issueId]
  );

  const deleteAttachment = useCallback(
    async (attachmentId: number) => {
      try {
        setError(null);
        await attachmentApi.delete(attachmentId);
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
        toast.success("Attachment deleted successfully");
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to delete attachment";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    },
    []
  );

  const downloadAttachment = useCallback(
    async (attachmentId: number, fileName: string) => {
      try {
        setError(null);
        await attachmentApi.download(attachmentId, fileName);
        toast.success("Download started");
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to download file";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    },
    []
  );

  return {
    attachments,
    loading,
    error,
    isUploading,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
    loadAttachments,
  };
};
