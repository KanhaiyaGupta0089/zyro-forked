import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Info,
} from "lucide-react";
import { projectApi } from "@/services/api/projectApi";
import { Project } from "@/services/api/types";
import { toast } from "react-hot-toast";

interface GitHubIntegrationProps {
  project: Project;
  onUpdate: () => void;
}

const GitHubIntegration = ({ project, onUpdate }: GitHubIntegrationProps) => {
  const [isLinking, setIsLinking] = useState(false);
  const [githubRepo, setGithubRepo] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [ngrokUrl, setNgrokUrl] = useState("");
  const [useNgrok, setUseNgrok] = useState(false);

  // Extract GitHub repo from project data - use state to track changes
  const [linkedRepo, setLinkedRepo] = useState<string | null>(
    project.data?.github_repo || null
  );

  // Update linkedRepo when project data changes
  useEffect(() => {
    setLinkedRepo(project.data?.github_repo || null);
  }, [project.data?.github_repo]);

  useEffect(() => {
    // Generate webhook URL
    let baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
    
    // Remove /api/v1 if present, we'll add it back for webhook
    baseUrl = baseUrl.replace(/\/api\/v1\/?$/, "");
    
    // Check if we're in localhost/development
    const isLocalhost = baseUrl.includes("localhost") || 
                       baseUrl.includes("127.0.0.1") || 
                       baseUrl.startsWith("http://localhost") ||
                       baseUrl.startsWith("http://127.0.0.1");
    
    if (isLocalhost) {
      // Development mode - require ngrok
      setUseNgrok(true);
      setNgrokUrl("");
      setWebhookUrl("");
    } else {
      // Production mode - use production URL directly
      setUseNgrok(false);
      // Ensure baseUrl doesn't have trailing slash
      const cleanBaseUrl = baseUrl.replace(/\/$/, "");
      setWebhookUrl(`${cleanBaseUrl}/api/v1/webhook/github`);
    }
  }, []);

  const handleNgrokUrlChange = (url: string) => {
    setNgrokUrl(url);
    if (url.trim()) {
      // Remove trailing slash if present
      const cleanUrl = url.trim().replace(/\/$/, "");
      setWebhookUrl(`${cleanUrl}/api/v1/webhook/github`);
    } else {
      setWebhookUrl("");
    }
  };

  const handleLink = async () => {
    if (!githubRepo.trim()) {
      toast.error("Please enter a GitHub repository (format: owner/repo)");
      return;
    }

    // Validate format
    const repoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
    if (!repoPattern.test(githubRepo.trim())) {
      toast.error("Invalid format. Use: owner/repository (e.g., octocat/Hello-World)");
      return;
    }

    try {
      setIsLinking(true);
      await projectApi.linkGitHubRepo(project.id, githubRepo.trim());
      toast.success("GitHub repository linked successfully!");
      setShowLinkForm(false);
      setGithubRepo("");
      // Wait a bit for database to update, then refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      await onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to link repository");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm("Are you sure you want to unlink this GitHub repository?")) {
      return;
    }

    try {
      setIsLinking(true);
      // Update project data to remove github_repo
      await projectApi.updateProject(project.id, {
        data: { ...project.data, github_repo: null },
      });
      toast.success("GitHub repository unlinked successfully!");
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to unlink repository");
    } finally {
      setIsLinking(false);
    }
  };

  const copyWebhookUrl = () => {
    if (!webhookUrl || webhookUrl.includes("your-ngrok-url") || webhookUrl.trim() === "") {
      toast.error("Please provide a valid webhook URL first");
      return;
    }
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied to clipboard!");
  };

  const openGitHubRepo = () => {
    if (linkedRepo) {
      window.open(`https://github.com/${linkedRepo}`, "_blank");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Github className="w-5 h-5 text-[#6B778C]" />
          <h3 className="text-base font-semibold text-[#172B4D]">
            GitHub Integration
          </h3>
        </div>
      </div>

      {linkedRepo ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Linked Repository Status */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Repository Linked
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    GitHub events will be synced automatically
                  </p>
                </div>
              </div>
              <button
                onClick={handleUnlink}
                disabled={isLinking}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
              >
                <Unlink className="w-4 h-4" />
                Unlink
              </button>
            </div>

            <div className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
              <Github className="w-4 h-4 text-[#6B778C]" />
              <span className="text-sm font-mono text-[#172B4D] flex-1">
                {linkedRepo}
              </span>
              <button
                onClick={openGitHubRepo}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Open on GitHub"
              >
                <ExternalLink className="w-4 h-4 text-[#6B778C]" />
              </button>
            </div>
          </div>

          {/* Webhook Configuration */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Webhook Configuration
                </p>
                <p className="text-xs text-blue-700">
                  Add this webhook URL to your GitHub repository settings to enable automatic syncing
                </p>
              </div>
            </div>

            {useNgrok ? (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-yellow-900 mb-1">
                      Using ngrok for Local Development
                    </p>
                    <p className="text-xs text-yellow-700 mb-2">
                      GitHub cannot reach localhost. Use ngrok to create a public tunnel.
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-yellow-900 mb-1">
                          Your ngrok URL (e.g., https://abc123.ngrok.io)
                        </label>
                        <input
                          type="text"
                          value={ngrokUrl}
                          onChange={(e) => handleNgrokUrlChange(e.target.value)}
                          placeholder="https://your-ngrok-url.ngrok.io"
                          className="w-full px-3 py-2 text-sm bg-white border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                      <div className="text-xs text-yellow-700 space-y-1">
                        <p className="font-medium">Quick Setup:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Install ngrok: <code className="bg-yellow-100 px-1 rounded">npm install -g ngrok</code> or download from ngrok.com</li>
                          <li>Start your backend server on port 8000</li>
                          <li>Run: <code className="bg-yellow-100 px-1 rounded">ngrok http 8000</code></li>
                          <li>Copy the HTTPS URL (e.g., https://abc123.ngrok.io)</li>
                          <li>Paste it above</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-900 mb-1">
                      Production Mode Detected
                    </p>
                    <p className="text-xs text-green-700">
                      Your webhook URL is automatically configured using your production API URL. 
                      No additional setup required for local development tools.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  readOnly={!useNgrok}
                  onChange={useNgrok ? (e) => setWebhookUrl(e.target.value) : undefined}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-blue-200 rounded font-mono"
                  placeholder={useNgrok ? "Enter ngrok URL above to generate webhook URL" : "Webhook URL will be generated automatically"}
                />
                <button
                  onClick={copyWebhookUrl}
                  disabled={!webhookUrl || webhookUrl.trim() === ""}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>

              <div className="text-xs text-blue-700 space-y-1">
                <p className="font-medium">Steps to configure in GitHub:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to your GitHub repository → Settings → Webhooks</li>
                  <li>Click "Add webhook"</li>
                  <li>Paste the webhook URL above</li>
                  <li>Set Content type to "application/json"</li>
                  <li>Add your webhook secret (GITHUB_SECRET_KEY from .env.local)</li>
                  <li>Select events: ✅ Push, ✅ Pull requests, ✅ Issues, ✅ Releases</li>
                  <li>Click "Add webhook"</li>
                  {useNgrok && (
                    <li className="text-yellow-700 font-medium">
                      ⚠️ Keep ngrok running while testing webhooks
                    </li>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Not Linked State */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  No GitHub repository linked
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Link a GitHub repository to sync issues, pull requests, and commits
                </p>
              </div>
            </div>

            <AnimatePresence>
              {showLinkForm ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GitHub Repository
                    </label>
                    <input
                      type="text"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      placeholder="owner/repository (e.g., octocat/Hello-World)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLinking}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: username/repository-name
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLink}
                      disabled={isLinking || !githubRepo.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Link2 className="w-4 h-4" />
                      {isLinking ? "Linking..." : "Link Repository"}
                    </button>
                    <button
                      onClick={() => {
                        setShowLinkForm(false);
                        setGithubRepo("");
                      }}
                      disabled={isLinking}
                      className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => setShowLinkForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  Link GitHub Repository
                </button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GitHubIntegration;
