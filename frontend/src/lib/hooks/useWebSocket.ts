import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  maxReconnectAttempts?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  maxReconnectAttempts = 1, // Only try once by default
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const hasAttemptedConnectionRef = useRef(false);

  useEffect(() => {
    // Only attempt connection once
    if (hasAttemptedConnectionRef.current) {
      return;
    }

    hasAttemptedConnectionRef.current = true;
    setConnectionStatus("connecting");

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          // Silent error handling
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onClose?.();
      };

      ws.onerror = (error) => {
        setConnectionStatus("error");
        setIsConnected(false);
        onError?.(error);
      };
    } catch (error) {
      setConnectionStatus("error");
      setIsConnected(false);
      onError?.(error as Event);
    }

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url]); // Only depend on URL

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    connectionStatus,
    sendMessage,
  };
}
