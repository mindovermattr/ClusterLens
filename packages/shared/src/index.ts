export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export type SmokeClusterSnapshot = {
  type: "snapshot";
  cluster: {
    id: string;
    nodes: Array<{
      id: string;
      status: "online";
    }>;
  };
};
