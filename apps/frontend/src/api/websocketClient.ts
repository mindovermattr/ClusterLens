import type { ConnectionStatus } from "@clusterlens/shared";

type ClusterWebSocketClientOptions = {
  url: string;
  WebSocketConstructor?: typeof WebSocket;
  onStatusChange: (status: ConnectionStatus) => void;
  onSnapshot: (snapshot: unknown) => void;
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

    try {
      const message = JSON.parse(data);

      if (message.type === "snapshot") {
        options.onSnapshot(message);
      }
    } catch {
      // Ignore malformed smoke messages until the protocol is formalized.
    }
  });

  return {
    close() {
      socket.close();
    }
  };
}
