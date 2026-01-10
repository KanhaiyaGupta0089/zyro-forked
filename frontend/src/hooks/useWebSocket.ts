import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  [key: string]: any;
}

interface UseWebSocketOptions {
  projectId: number | null;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useWebSocket = ({
  projectId,
  onMessage,
  onError,
  onConnect,
  onDisconnect,
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const getToken = useCallback(() => {
    try {
      const authState = localStorage.getItem('authState');
      if (authState) {
        const parsed = JSON.parse(authState);
        return parsed?.token || localStorage.getItem('access_token');
      }
      return localStorage.getItem('access_token');
    } catch {
      return localStorage.getItem('access_token');
    }
  }, []);

  // Store callbacks in refs to avoid recreating connect function
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onMessage, onError, onConnect, onDisconnect]);

  const connect = useCallback(() => {
    if (!projectId) return;

    // Don't connect if already connected or connecting
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log(`WebSocket already connected/connecting for project ${projectId}, skipping`);
      return;
    }

    const token = getToken();
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // Get base URL from environment or use default
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const wsProtocol = baseURL.startsWith('https') ? 'wss' : 'ws';
    const wsBaseURL = baseURL.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
    const wsUrl = `${wsProtocol}://${wsBaseURL}/ws/issues/${projectId}?token=${token}`;
      
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`WebSocket connected to project ${projectId}`);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        onConnectRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log(`WebSocket message received for project ${projectId}:`, message);
          
          // Handle pong for keepalive
          if (message.type === 'pong') {
            return;
          }
          
          // Handle connected message
          if (message.type === 'connected') {
            console.log(`WebSocket connected message: ${message.message}`);
            return;
          }
          
          // Pass all other messages to the handler
          console.log(`Passing message to handler:`, message.type);
          onMessageRef.current?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for project ${projectId}:`, error);
        onErrorRef.current?.(error);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected from project ${projectId}`, event.code, event.reason);
        setIsConnected(false);
        onDisconnectRef.current?.();

        // Only attempt to reconnect if it wasn't a manual close (code 1000) or authentication error (1008)
        // Don't reconnect if we're cleaning up (wsRef.current is null)
        if (wsRef.current && event.code !== 1000 && event.code !== 1008) {
          // Attempt to reconnect
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectDelay);
          } else {
            console.error(`Max reconnection attempts reached for project ${projectId}`);
          }
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error(`Error creating WebSocket for project ${projectId}:`, error);
    }
  }, [projectId, getToken]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      // Set to null before closing to prevent reconnection in onclose handler
      const ws = wsRef.current;
      wsRef.current = null;
      ws.close(1000, 'Manual disconnect'); // Normal closure code
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (!projectId) {
      disconnect();
      return;
    }

    // Only connect if not already connected or if connection is closed/closing
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED || wsRef.current.readyState === WebSocket.CLOSING) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // Only depend on projectId to avoid reconnecting on every render

  // Keepalive ping
  useEffect(() => {
    if (!isConnected || !projectId) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Send ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, projectId, sendMessage]);

  return {
    isConnected,
    sendMessage,
    disconnect,
    connect,
  };
};

