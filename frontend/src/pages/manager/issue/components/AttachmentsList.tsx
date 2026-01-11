import { motion } from "framer-motion";
import { Download, Trash2, File, Image, FileText, FileSpreadsheet, FileCode, Archive, FileVideo, Eye, Share2 } from "lucide-react";
import { Attachment } from "@/services/api/attachmentApi";

interface AttachmentsListProps {
  attachments: Attachment[];
  onDownload: (attachmentId: number, fileName: string) => void;
  onDelete: (attachmentId: number) => void;
  onView?: (attachment: Attachment) => void;
  onShare?: (attachment: Attachment) => void;
  isLoading?: boolean;
}

const getFileIcon = (fileType: string, fileName: string) => {
  const type = fileType.toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (type.startsWith('image/')) {
    return <Image className="w-5 h-5 text-blue-500" />;
  }
  if (type.includes('pdf') || type.includes('document') || ext === 'pdf' || ['doc', 'docx'].includes(ext)) {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  if (type.includes('spreadsheet') || type.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  }
  if (type.includes('video') || ['mp4', 'avi', 'mov', 'mkv'].includes(ext)) {
    return <FileVideo className="w-5 h-5 text-purple-500" />;
  }
  if (type.includes('zip') || type.includes('archive') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <Archive className="w-5 h-5 text-yellow-500" />;
  }
  if (type.includes('code') || type.includes('text') || ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(ext)) {
    return <FileCode className="w-5 h-5 text-orange-500" />;
  }
  return <File className="w-5 h-5 text-gray-500" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const AttachmentsList = ({
  attachments,
  onDownload,
  onDelete,
  onView,
  onShare,
  isLoading = false,
}: AttachmentsListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8">
        <File className="w-12 h-12 text-[#C1C7D0] mx-auto mb-2" />
        <p className="text-sm text-[#6B778C]">No attachments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment, index) => (
        <motion.div
          key={attachment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-3 p-3 rounded border border-[#DFE1E6] hover:bg-[#F4F5F7] transition-colors group"
        >
          <div className="flex-shrink-0">
            {getFileIcon(attachment.file_type, attachment.file_name)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-[#172B4D] truncate" title={attachment.file_name}>
                {attachment.file_name}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#6B778C]">
              <span>{formatFileSize(attachment.file_size)}</span>
              {attachment.uploader_name && (
                <>
                  <span>•</span>
                  <span>Uploaded by {attachment.uploader_name}</span>
                </>
              )}
              {attachment.created_at && (
                <>
                  <span>•</span>
                  <span>
                    {new Date(attachment.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onView && (
              <button
                onClick={() => onView(attachment)}
                className="p-1.5 hover:bg-[#EBF2FF] rounded text-[#0052CC] transition-colors"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare(attachment)}
                className="p-1.5 hover:bg-[#F4F5F7] rounded text-[#6B778C] transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDownload(attachment.id, attachment.file_name)}
              className="p-1.5 hover:bg-[#E3FCEF] rounded text-[#006644] transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${attachment.file_name}"?`)) {
                  onDelete(attachment.id);
                }
              }}
              className="p-1.5 hover:bg-[#FFEBE6] rounded text-[#DE350B] transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
