import type { ConnectionStatus, SmokeClusterSnapshot } from "@clusterlens/shared";

type ClusterWebSocketClientOptions = {
  url: string;
  WebSocketConstructor?: typeof WebSocket;
  onStatusChange: (status: ConnectionStatus) => void;
  onSnapshot: (snapshot: SmokeClusterSnapshot) => void;
};

function isSmokeClusterSnapshot(message: unknown): message is SmokeClusterSnapshot {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as {
    type?: unknown;
    cluster?: {
      id?: unknown;
      nodes?: unknown;
    };
  };

  return (
    candidate.type === "snapshot" &&
    typeof candidate.cluster?.id === "string" &&
    Array.isArray(candidate.cluster.nodes) &&
    candidate.cluster.nodes.every((node) => {
      const candidateNode = node as { id?: unknown; status?: unknown };

      return (
        !!node &&
        typeof node === "object" &&
        typeof candidateNode.id === "string" &&
        candidateNode.status === "online"
      );
    })
  );
}

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

      if (isSmokeClusterSnapshot(message)) {
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
