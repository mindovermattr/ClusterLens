import type { ConnectionStatus } from "@clusterlens/shared";
import { handleServerEvent, parseServerEvent, type ServerEventHandlers } from "./protocol";

type ClusterWebSocketClientOptions = ServerEventHandlers & {
  url: string;
  WebSocketConstructor?: typeof WebSocket;
  onStatusChange: (status: ConnectionStatus) => void;
};

export function createClusterWebSocketClient(options: ClusterWebSocketClientOptions) {
  const WebSocketConstructor = options.WebSocketConstructor ?? WebSocket;

  options.onStatusChange("connecting");
  const socket = new WebSocketConstructor(options.url);

  socket.addEventListener("open", () => {
    options.onStatusChange("connected");
  });

  socket.addEventListener("close", () => {
    options.onStatusChange("disconnected");
  });

  socket.addEventListener("error", () => {
    options.onStatusChange("disconnected");
  });

  socket.addEventListener("message", (event) => {
    const data = typeof event.data === "string" ? event.data : "";
    const message = parseServerEvent(data);

    if (message) {
      handleServerEvent(message, options);
    }
  });

  return {
    close() {
      socket.close();
    }
  };
}
