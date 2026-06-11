import { beforeEach, describe, expect, test } from "vitest";
import type { ClusterSnapshot, EventLogEntry, NetworkMessageSnapshot, NodeSnapshot } from "@clusterlens/shared";
import { EVENT_LOG_LIMIT, useClusterStore } from "./store";

const nodeA: NodeSnapshot = { id: "node-a", role: "follower", status: "alive" };
const nodeB: NodeSnapshot = { id: "node-b", role: "leader", status: "alive" };

const pendingMessage: NetworkMessageSnapshot = {
  id: "message-1",
  type: "heartbeat",
  sourceNodeId: "node-b",
  targetNodeId: "node-a",
  sentAtMs: 0,
  deliverAtMs: 200,
  status: "pending"
};

const snapshot: ClusterSnapshot = {
  timeMs: 1000,
  running: true,
  leaderId: "node-b",
  nodes: [nodeA, nodeB],
  network: {
    latencyMs: 200,
    packetLossRate: 0,
    partitions: [],
    messages: [pendingMessage]
  }
};

function eventLogEntry(index: number): EventLogEntry {
  return {
    timestampMs: index,
    eventType: "message_sent",
    source: "node-a",
    target: "node-b",
    message: `event ${index}`
  };
}

describe("cluster store", () => {
  beforeEach(() => {
    useClusterStore.getState().resetStore();
  });

  test("hydrates snapshot state and keeps selected nodes valid", () => {
    useClusterStore.getState().setSelectedNodeId("node-a");
    useClusterStore.getState().handleSnapshot(snapshot);

    expect(useClusterStore.getState().snapshot).toEqual(snapshot);
    expect(useClusterStore.getState().selectedNodeId).toBe("node-a");
    expect(useClusterStore.getState().activeMessages).toEqual([pendingMessage]);
    expect(useClusterStore.getState().latencyDraftMs).toBe(200);

    useClusterStore.getState().handleSnapshot({ ...snapshot, nodes: [nodeB] });

    expect(useClusterStore.getState().selectedNodeId).toBeNull();
  });

  test("applies incremental server events", () => {
    useClusterStore.getState().handleSnapshot(snapshot);

    useClusterStore.getState().handleNodeUpdated({ ...nodeA, status: "down" });
    useClusterStore.getState().handleLeaderChanged(null);
    useClusterStore.getState().handleMessageDropped("message-1");

    expect(useClusterStore.getState().snapshot?.nodes[0]).toEqual({ ...nodeA, status: "down" });
    expect(useClusterStore.getState().snapshot?.leaderId).toBeNull();
    expect(useClusterStore.getState().activeMessages).toEqual([]);
    expect(useClusterStore.getState().snapshot?.network.messages[0]).toEqual({ ...pendingMessage, status: "dropped" });

    useClusterStore.getState().handleMessageSent(pendingMessage);
    useClusterStore.getState().handleMessageDelivered("message-1");

    expect(useClusterStore.getState().snapshot?.network.messages[0]).toEqual({
      ...pendingMessage,
      status: "delivered"
    });
  });

  test("keeps pending latency drafts until a snapshot confirms them", () => {
    useClusterStore.getState().handleSnapshot(snapshot);
    useClusterStore.getState().setLatencyDraftMs(500);

    useClusterStore.getState().handleSnapshot({ ...snapshot, network: { ...snapshot.network, latencyMs: 200 } });

    expect(useClusterStore.getState().latencyDraftMs).toBe(500);

    useClusterStore.getState().handleSnapshot({ ...snapshot, network: { ...snapshot.network, latencyMs: 500 } });

    expect(useClusterStore.getState().latencyDraftMs).toBe(500);
    expect(useClusterStore.getState().latencyDraftDirty).toBe(false);
  });

  test("bounds the event log to the newest entries", () => {
    for (let index = 0; index < EVENT_LOG_LIMIT + 5; index += 1) {
      useClusterStore.getState().handleEventLog(eventLogEntry(index));
    }

    expect(useClusterStore.getState().eventLog).toHaveLength(EVENT_LOG_LIMIT);
    expect(useClusterStore.getState().eventLog[0].message).toBe("event 5");
    expect(useClusterStore.getState().eventLog.at(-1)?.message).toBe(`event ${EVENT_LOG_LIMIT + 4}`);
  });

  test("records errors and clears them on the next authoritative snapshot", () => {
    useClusterStore.getState().handleError("Unknown node id: missing-node");

    expect(useClusterStore.getState().lastError).toBe("Unknown node id: missing-node");

    useClusterStore.getState().handleSnapshot(snapshot);

    expect(useClusterStore.getState().lastError).toBeNull();
  });
});
