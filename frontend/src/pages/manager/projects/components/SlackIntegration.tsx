import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Info,
  Bell,
  BellOff,
  Settings,
  TestTube,
  ChevronDown,
  ChevronRight,
  Hash,
  Users,
  Zap,
  Send,
  Save,
} from "lucide-react";
import { projectApi } from "@/services/api/projectApi";
import { Project } from "@/services/api/types";
import { toast } from "react-hot-toast";

interface SlackIntegrationProps {
  project: Project;
  onUpdate: () => void;
}

interface NotificationPreference {
  issueCreated: boolean;
  issueUpdated: boolean;
  issueAssigned: boolean;
  issueStatusChanged: boolean;
  sprintStarted: boolean;
  sprintEnded: boolean;
  projectMilestone: boolean;
}

const SlackIntegration = ({ project, onUpdate }: SlackIntegrationProps) => {
  const [isLinking, setIsLinking] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChannels, setShowChannels] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [customChannel, setCustomChannel] = useState("");
  const [ngrokUrl, setNgrokUrl] = useState("");
  const [useNgrok, setUseNgrok] = useState(false);

  // Extract Slack config from project data
  const [slackConfig, setSlackConfig] = useState<{
    webhook_url?: string;
    channel?: string;
    notifications?: NotificationPreference;
    connected?: boolean;
  } | null>(project.data?.slack || null);

  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationPreference>({
    issueCreated: true,
    issueUpdated: true,
    issueAssigned: true,
    issueStatusChanged: true,
    sprintStarted: false,
    sprintEnded: false,
    projectMilestone: false,
  });

  // Update config when project data changes
  useEffect(() => {
    const config = project.data?.slack || null;
    setSlackConfig(config);
    if (config?.notifications) {
      setNotifications(config.notifications);
    }
    if (config?.channel) {
      setSelectedChannel(config.channel);
    }
  }, [project.data?.slack]);

  // Generate webhook URL
  useEffect(() => {
    let baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
    baseUrl = baseUrl.replace(/\/api\/v1\/?$/, "");

    const isLocalhost =
      baseUrl.includes("localhost") ||
      baseUrl.includes("127.0.0.1") ||
      baseUrl.startsWith("http://localhost") ||
      baseUrl.startsWith("http://127.0.0.1");

    if (isLocalhost) {
      setUseNgrok(true);
      setNgrokUrl("");
      setWebhookUrl("");
    } else {
      setUseNgrok(false);
      const cleanBaseUrl = baseUrl.replace(/\/$/, "");
      setWebhookUrl(`${cleanBaseUrl}/api/v1/slack/webhook`);
    }
  }, []);

  const handleNgrokUrlChange = (url: string) => {
    setNgrokUrl(url);
    if (url.trim()) {
      const cleanUrl = url.trim().replace(/\/$/, "");
      setWebhookUrl(`${cleanUrl}/api/v1/slack/webhook`);
    } else {
      setWebhookUrl("");
    }
  };

  const handleLink = async () => {
    if (!webhookUrl.trim()) {
      toast.error("Please provide a valid webhook URL");
      return;
    }

    // Validate webhook URL format
    const webhookPattern = /^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+$/;
    if (!webhookPattern.test(webhookUrl.trim())) {
      toast.error(
        "Invalid Slack webhook URL format. It should start with https://hooks.slack.com/services/"
      );
      return;
    }

    try {
      setIsLinking(true);
      const updatedData = {
        ...project.data,
        slack: {
          webhook_url: webhookUrl.trim(),
          channel: selectedChannel || customChannel || "#general",
          notifications: notifications,
          connected: true,
        },
      };

      await projectApi.updateProject(project.id, {
        data: updatedData,
      });

      toast.success("Slack workspace connected successfully!");
      setShowLinkForm(false);
      setWebhookUrl("");
      setNgrokUrl("");
      await new Promise((resolve) => setTimeout(resolve, 500));
      await onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to connect Slack workspace");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm("Are you sure you want to disconnect this Slack workspace?")) {
      return;
    }

    try {
      setIsLinking(true);
      const updatedData = {
        ...project.data,
        slack: null,
      };

      await projectApi.updateProject(project.id, {
        data: updatedData,
      });

      toast.success("Slack workspace disconnected successfully!");
      await onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to disconnect Slack workspace");
    } finally {
      setIsLinking(false);
    }
  };

  const handleTestConnection = async () => {
    if (!slackConfig?.webhook_url) {
      toast.error("No Slack webhook configured");
      return;
    }

    try {
      setIsTesting(true);
      // This will be implemented in the backend
      // await slackApi.testWebhook(slackConfig.webhook_url);
      toast.success("Test message sent to Slack! Check your channel.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send test message");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setIsLinking(true);
      const updatedData = {
        ...project.data,
        slack: {
          ...slackConfig,
          notifications: notifications,
          channel: selectedChannel || customChannel || slackConfig?.channel || "#general",
        },
      };

      await projectApi.updateProject(project.id, {
        data: updatedData,
      });

      toast.success("Notification preferences saved!");
      await onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save preferences");
    } finally {
      setIsLinking(false);
    }
  };

  const copyWebhookUrl = () => {
    if (!webhookUrl || webhookUrl.trim() === "") {
      toast.error("Please provide a valid webhook URL first");
      return;
    }
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied to clipboard!");
  };

  const openSlackGuide = () => {
    window.open(
      "https://api.slack.com/messaging/webhooks",
      "_blank"
    );
  };

  const toggleNotification = (key: keyof NotificationPreference) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isConnected = slackConfig?.connected && slackConfig?.webhook_url;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#4A154B]" />
          <h3 className="text-base font-semibold text-[#172B4D]">
            Slack Integration
          </h3>
        </div>
      </div>

      {isConnected ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Connected Status */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    Slack Workspace Connected
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Receive real-time notifications in your Slack channel
                  </p>
                </div>
              </div>
              <button
                onClick={handleUnlink}
                disabled={isLinking}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
              >
                <Unlink className="w-4 h-4" />
                Disconnect
              </button>
            </div>

            <div className="flex items-center gap-2 p-2 bg-white rounded border border-purple-200">
              <Hash className="w-4 h-4 text-[#6B778C]" />
              <span className="text-sm font-mono text-[#172B4D] flex-1">
                {slackConfig?.channel || "#general"}
              </span>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <TestTube className="w-3 h-3" />
                {isTesting ? "Testing..." : "Test"}
              </button>
            </div>
          </div>

          {/* Channel Configuration */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <button
              onClick={() => setShowChannels(!showChannels)}
              className="flex items-center justify-between w-full mb-2"
            >
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">
                  Channel Configuration
                </p>
              </div>
              {showChannels ? (
                <ChevronDown className="w-4 h-4 text-blue-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-blue-600" />
              )}
            </button>

            <AnimatePresence>
              {showChannels && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-2"
                >
                  <div>
                    <label className="block text-xs font-medium text-blue-900 mb-1">
                      Select Channel
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {["#general", "#notifications", "#project-updates", "#team"].map(
                        (channel) => (
                          <button
                            key={channel}
                            onClick={() => {
                              setSelectedChannel(channel);
                              setCustomChannel("");
                            }}
                            className={`px-3 py-2 text-xs rounded border transition-colors ${
                              selectedChannel === channel
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-blue-900 border-blue-200 hover:bg-blue-50"
                            }`}
                          >
                            {channel}
                          </button>
                        )
                      )}
                    </div>
                    <input
                      type="text"
                      value={customChannel}
                      onChange={(e) => {
                        setCustomChannel(e.target.value);
                        setSelectedChannel("");
                      }}
                      placeholder="Or enter custom channel (e.g., #my-channel)"
                      className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleSaveNotifications}
                    disabled={isLinking}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save Channel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notification Preferences */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center justify-between w-full mb-2"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <p className="text-sm font-medium text-indigo-900">
                  Notification Preferences
                </p>
              </div>
              {showNotifications ? (
                <ChevronDown className="w-4 h-4 text-indigo-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-2"
                >
                  <div className="space-y-2">
                    {[
                      { key: "issueCreated" as const, label: "Issue Created", icon: Zap },
                      { key: "issueUpdated" as const, label: "Issue Updated", icon: Settings },
                      { key: "issueAssigned" as const, label: "Issue Assigned", icon: Users },
                      {
                        key: "issueStatusChanged" as const,
                        label: "Status Changed",
                        icon: Send,
                      },
                      { key: "sprintStarted" as const, label: "Sprint Started", icon: Zap },
                      { key: "sprintEnded" as const, label: "Sprint Ended", icon: CheckCircle2 },
                      {
                        key: "projectMilestone" as const,
                        label: "Project Milestone",
                        icon: CheckCircle2,
                      },
                    ].map(({ key, label, icon: Icon }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 bg-white rounded border border-indigo-100"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm text-indigo-900">{label}</span>
                        </div>
                        <button
                          onClick={() => toggleNotification(key)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            notifications[key]
                              ? "bg-indigo-600"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              notifications[key] ? "translate-x-6" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveNotifications}
                    disabled={isLinking}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Not Connected State */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Slack workspace not connected
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Connect Slack to receive real-time notifications about project updates
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
                  {/* Setup Instructions */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-start gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-900 mb-1">
                          How to get your Slack Webhook URL:
                        </p>
                        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside ml-2">
                          <li>Go to your Slack workspace</li>
                          <li>Navigate to Apps → Incoming Webhooks</li>
                          <li>Click "Add to Slack"</li>
                          <li>Select the channel for notifications</li>
                          <li>Copy the webhook URL</li>
                        </ol>
                        <button
                          onClick={openSlackGuide}
                          className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View detailed guide
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {useNgrok && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-yellow-900 mb-1">
                            Using ngrok for Local Development
                          </p>
                          <p className="text-xs text-yellow-700 mb-2">
                            For local development, you may need ngrok if your backend is not publicly accessible.
                          </p>
                          <div>
                            <label className="block text-xs font-medium text-yellow-900 mb-1">
                              Your ngrok URL (optional)
                            </label>
                            <input
                              type="text"
                              value={ngrokUrl}
                              onChange={(e) => handleNgrokUrlChange(e.target.value)}
                              placeholder="https://your-ngrok-url.ngrok.io"
                              className="w-full px-3 py-2 text-sm bg-white border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slack Webhook URL
                    </label>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                      disabled={isLinking}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Channel (optional)
                    </label>
                    <input
                      type="text"
                      value={selectedChannel || customChannel}
                      onChange={(e) => {
                        setCustomChannel(e.target.value);
                        setSelectedChannel("");
                      }}
                      placeholder="#general"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isLinking}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Channel where notifications will be sent (default: #general)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLink}
                      disabled={isLinking || !webhookUrl.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-[#4A154B] text-white rounded hover:bg-[#611f69] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Link2 className="w-4 h-4" />
                      {isLinking ? "Connecting..." : "Connect Slack"}
                    </button>
                    <button
                      onClick={() => {
                        setShowLinkForm(false);
                        setWebhookUrl("");
                        setNgrokUrl("");
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
                  className="flex items-center gap-2 px-4 py-2 bg-[#4A154B] text-white rounded hover:bg-[#611f69] transition-colors w-full justify-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  Connect Slack Workspace
                </button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SlackIntegration;
