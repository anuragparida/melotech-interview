import { useCallback } from "react";
import { useWebSocket } from "./useWebSocket";

interface SubmissionUpdate {
  submission_id: string;
  title: string;
  updated_fields: string[];
  new_data: {
    status: string;
    rating: number;
    feedback: string;
  };
  timestamp: string;
}

interface UseAdminWebSocketOptions {
  onSubmissionUpdate?: (update: SubmissionUpdate) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

export function useAdminWebSocket({
  onSubmissionUpdate,
  onConnectionChange,
}: UseAdminWebSocketOptions = {}) {
  const handleMessage = useCallback(
    (message: any) => {
      if (message.type === "submission_update") {
        onSubmissionUpdate?.(message.data);
      }
    },
    [onSubmissionUpdate]
  );

  const handleOpen = useCallback(() => {
    onConnectionChange?.(true);
  }, [onConnectionChange]);

  const handleClose = useCallback(() => {
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  const { isConnected, connectionStatus, sendMessage } = useWebSocket({
    url: `${
      import.meta.env.PROD
        ? "wss://melotech.anuragparida.com/ws/admin"
        : "ws://localhost:8000/ws/admin"
    }`,
    onMessage: handleMessage,
    onOpen: handleOpen,
    onClose: handleClose,
    maxReconnectAttempts: 1, // Only try once
  });

  return {
    isConnected,
    connectionStatus,
    sendMessage,
  };
}
