import { describe, expect, test } from "vitest";
import type { ClusterSnapshot } from "./types";
import { selectPartitionGroups } from "./selectors";

const snapshot: ClusterSnapshot = {
  timeMs: 0,
  running: true,
  leaderId: "node-5",
  nodes: [
    { id: "node-1", role: "follower", status: "alive" },
    { id: "node-2", role: "follower", status: "alive" },
    { id: "node-3", role: "follower", status: "alive" },
    { id: "node-4", role: "follower", status: "alive" },
    { id: "node-5", role: "leader", status: "alive" }
  ],
  network: {
    latencyMs: 200,
    packetLossRate: 0,
    partitions: [],
    messages: []
  }
};

describe("domain selectors", () => {
  test("creates selected-node 2-vs-rest partition groups", () => {
    expect(selectPartitionGroups(snapshot, "node-3")).toEqual([["node-3", "node-1"], ["node-2", "node-4", "node-5"]]);
  });

  test("falls back to a fixed 2-vs-rest partition without a selected node", () => {
    expect(selectPartitionGroups(snapshot, null)).toEqual([["node-1", "node-2"], ["node-3", "node-4", "node-5"]]);
  });
});
