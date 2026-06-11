import { describe, expect, test } from "vitest";
import { ClientCommandSchema, CLIENT_COMMAND_TYPES } from "./commands.js";
import { ServerEventSchema } from "./events.js";
import { ClusterSnapshotSchema } from "./snapshots.js";

const snapshot = {
  timeMs: 500,
  running: true,
  leaderId: "node-3",
  nodes: [
    { id: "node-1", role: "follower", status: "alive" },
    { id: "node-2", role: "candidate", status: "alive" },
    { id: "node-3", role: "leader", status: "alive" }
  ],
  network: {
    latencyMs: 200,
    packetLossRate: 0,
    partitions: [{ groups: [["node-1"], ["node-2", "node-3"]] }],
    messages: [
      {
        id: "message-1",
        type: "heartbeat",
        sourceNodeId: "node-3",
        targetNodeId: "node-1",
        sentAtMs: 300,
        deliverAtMs: 500,
        status: "pending"
      }
    ]
  }
};

describe("shared protocol schemas", () => {
  test("accepts MVP client commands", () => {
    expect(ClientCommandSchema.parse({ type: CLIENT_COMMAND_TYPES.SIMULATION_START })).toEqual({
      type: "simulation:start"
    });
    expect(ClientCommandSchema.parse({ type: CLIENT_COMMAND_TYPES.NODE_KILL, nodeId: "node-3" })).toEqual({
      type: "node:kill",
      nodeId: "node-3"
    });
    expect(
      ClientCommandSchema.parse({
        type: CLIENT_COMMAND_TYPES.NETWORK_CREATE_PARTITION,
        groups: [["node-1"], ["node-2", "node-3"]]
      })
    ).toEqual({
      type: "network:createPartition",
      groups: [["node-1"], ["node-2", "node-3"]]
    });
  });

  test("rejects malformed client commands before they reach the backend", () => {
    expect(ClientCommandSchema.safeParse({ type: CLIENT_COMMAND_TYPES.NODE_KILL }).success).toBe(false);
    expect(
      ClientCommandSchema.safeParse({ type: CLIENT_COMMAND_TYPES.NETWORK_SET_LATENCY, latencyMs: -1 }).success
    ).toBe(false);
    expect(
      ClientCommandSchema.safeParse({ type: CLIENT_COMMAND_TYPES.NETWORK_CREATE_PARTITION, groups: [["node-1"]] })
        .success
    ).toBe(false);
  });

  test("validates snapshots and server event payloads shared by frontend and backend", () => {
    expect(ClusterSnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(ServerEventSchema.parse({ type: "snapshot", state: snapshot })).toEqual({ type: "snapshot", state: snapshot });
    expect(ServerEventSchema.parse({ type: "leader_changed", leaderId: null })).toEqual({
      type: "leader_changed",
      leaderId: null
    });
    expect(
      ServerEventSchema.parse({
        type: "event_log",
        entry: {
          timestampMs: 500,
          eventType: "leader_changed",
          source: "node-3",
          target: null,
          message: "node-3 became leader"
        }
      })
    ).toEqual({
      type: "event_log",
      entry: {
        timestampMs: 500,
        eventType: "leader_changed",
        source: "node-3",
        target: null,
        message: "node-3 became leader"
      }
    });
  });
});
