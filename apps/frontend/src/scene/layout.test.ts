import { describe, expect, test } from "vitest";
import type { NetworkMessageSnapshot, NodeSnapshot } from "../domain/types";
import { getEdgeState, getMessageProgress, getNodeLayout, isMessageVisible } from "./layout";

const nodes: NodeSnapshot[] = [
  { id: "node-c", role: "follower", status: "alive" },
  { id: "node-a", role: "leader", status: "alive" },
  { id: "node-b", role: "candidate", status: "alive" }
];

const message: NetworkMessageSnapshot = {
  id: "message-1",
  type: "heartbeat",
  sourceNodeId: "node-a",
  targetNodeId: "node-b",
  sentAtMs: 1000,
  deliverAtMs: 1400,
  status: "pending"
};

describe("scene layout helpers", () => {
  test("places nodes around a stable id-sorted circle", () => {
    const layout = getNodeLayout(nodes);

    expect([...layout.keys()]).toEqual(["node-a", "node-b", "node-c"]);
    expect(layout.get("node-a")?.angle).toBeCloseTo(-Math.PI / 2);
    expect(layout.get("node-a")?.position[0]).toBeCloseTo(0);
    expect(layout.get("node-a")?.position[2]).toBeCloseTo(-4.2);
  });

  test("marks cross-partition edges as blocked", () => {
    const partitions = [{ groups: [["node-a", "node-b"], ["node-c"]] }];

    expect(getEdgeState("node-a", "node-b", partitions)).toBe("connected");
    expect(getEdgeState("node-a", "node-c", partitions)).toBe("blocked");
  });

  test("clamps message progress across the delivery window", () => {
    expect(getMessageProgress(message, 900)).toBe(0);
    expect(getMessageProgress(message, 1200)).toBe(0.5);
    expect(getMessageProgress(message, 1600)).toBe(1);
  });

  test("keeps only pending messages visible until their timeout expires", () => {
    expect(isMessageVisible(message, 1400)).toBe(true);
    expect(isMessageVisible(message, 3200)).toBe(true);
    expect(isMessageVisible(message, 3201)).toBe(false);
    expect(isMessageVisible({ ...message, status: "delivered" }, 1200)).toBe(false);
    expect(isMessageVisible({ ...message, status: "dropped" }, 1200)).toBe(false);
  });
});
