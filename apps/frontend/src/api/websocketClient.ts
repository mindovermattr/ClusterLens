import type { ClientCommand, ConnectionStatus } from "@clusterlens/shared";
import { handleServerEvent, parseServerEvent, type ServerEventHandlers } from "./protocol";

type ClusterWebSocketClientOptions = ServerEventHandlers & {
  url: string;
  WebSocketConstructor?: typeof WebSocket;
  reconnectDelayMs?: number;
  onStatusChange: (status: ConnectionStatus) => void;
  onReconnectAttempt?: (attempt: number) => void;
};

export function createClusterWebSocketClient(options: ClusterWebSocketClientOptions) {
  const WebSocketConstructor = options.WebSocketConstructor ?? WebSocket;
  const reconnectDelayMs = options.reconnectDelayMs ?? 1000;
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;
  let closedByClient = false;

  function clearReconnectTimer(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function connect(): void {
    if (
      socket &&
      (socket.readyState === WebSocketConstructor.CONNECTING || socket.readyState === WebSocketConstructor.OPEN)
    ) {
      return;
    }

    clearReconnectTimer();
    closedByClient = false;
    options.onStatusChange("connecting");

    const currentSocket = new WebSocketConstructor(options.url);
    socket = currentSocket;

    currentSocket.addEventListener("open", () => {
      reconnectAttempt = 0;
      options.onStatusChange("connected");
    });

    currentSocket.addEventListener("close", () => {
      if (socket === currentSocket) {
        socket = null;
      }

      options.onStatusChange("disconnected");

      if (!closedByClient) {
        reconnectAttempt += 1;
        options.onReconnectAttempt?.(reconnectAttempt);
        reconnectTimer = setTimeout(connect, reconnectDelayMs);
      }
    });

    currentSocket.addEventListener("error", () => {
      currentSocket.close();
    });

    currentSocket.addEventListener("message", (event) => {
      const data = typeof event.data === "string" ? event.data : "";
      const message = parseServerEvent(data);

      if (message) {
        handleServerEvent(message, options);
      }
    });
  }

  connect();

  return {
    connect,
    disconnect() {
      closedByClient = true;
      clearReconnectTimer();
      socket?.close();
      socket = null;
    },
    sendCommand(command: ClientCommand) {
      if (!socket || socket.readyState !== WebSocketConstructor.OPEN) {
        return false;
      }

      socket.send(JSON.stringify(command));
      return true;
    },
    close() {
      this.disconnect();
    }
  };
}
