import { ServerEventSchema, type ClusterSnapshot, type ServerEvent } from "@clusterlens/shared";

export const smokeClusterSnapshot: ClusterSnapshot = {
  timeMs: 0,
  running: false,
  leaderId: "node-c",
  nodes: [
    { id: "node-a", role: "follower", status: "alive" },
    { id: "node-b", role: "follower", status: "alive" },
    { id: "node-c", role: "leader", status: "alive" }
  ],
  network: {
    latencyMs: 200,
    packetLossRate: 0,
    partitions: [],
    messages: []
  }
};

export function createSnapshotEvent(state: ClusterSnapshot = smokeClusterSnapshot): ServerEvent {
  return {
    type: "snapshot",
    state
  };
}

export function createErrorEvent(message: string): ServerEvent {
  return {
    type: "error",
    message
  };
}

export function serializeServerEvent(event: ServerEvent): string {
  return JSON.stringify(ServerEventSchema.parse(event));
}
