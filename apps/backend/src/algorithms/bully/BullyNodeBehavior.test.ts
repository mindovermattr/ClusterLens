import { describe, expect, test, vi } from "vitest";
import { Cluster } from "../../simulation/Cluster.js";
import { Network } from "../../simulation/Network.js";
import { BullyNodeBehavior } from "./BullyNodeBehavior.js";

function runBehaviorTicks({
  cluster,
  network,
  behavior,
  ticks,
  tickMs = 50
}: {
  cluster: Cluster;
  network: Network;
  behavior: BullyNodeBehavior;
  ticks: number;
  tickMs?: number;
}): void {
  for (let index = 0; index < ticks; index += 1) {
    cluster.advanceTime(tickMs);
    for (const node of cluster.nodes.values()) {
      behavior.onTick(node);
    }
    for (const message of network.deliverDue()) {
      const target = cluster.getNode(message.targetNodeId);
      if (target) {
        behavior.onMessage(target, message);
      }
    }
  }
}

describe("BullyNodeBehavior", () => {
  test("highest alive node wins startup election", () => {
    const cluster = new Cluster(4);
    const network = new Network(cluster, vi.fn());
    const behavior = new BullyNodeBehavior(cluster, network, vi.fn());

    behavior.onStart();
    runBehaviorTicks({ cluster, network, behavior, ticks: 8 });

    expect(cluster.leaderId).toBe("node-4");
    expect(cluster.getNode("node-4")).toMatchObject({ role: "leader", knownLeaderId: "node-4" });
    expect([...cluster.nodes.values()].slice(0, 3)).toEqual([
      expect.objectContaining({ role: "follower", knownLeaderId: "node-4" }),
      expect.objectContaining({ role: "follower", knownLeaderId: "node-4" }),
      expect.objectContaining({ role: "follower", knownLeaderId: "node-4" })
    ]);
  });

  test("heartbeat timeout after leader death elects next highest alive node", () => {
    const cluster = new Cluster(4);
    const network = new Network(cluster, vi.fn());
    const behavior = new BullyNodeBehavior(cluster, network, vi.fn(), {
      heartbeatIntervalMs: 100,
      heartbeatTimeoutMs: 300,
      electionTimeoutMs: 150
    });

    behavior.onStart();
    runBehaviorTicks({ cluster, network, behavior, ticks: 8 });
    cluster.killNode("node-4");
    behavior.onStop(cluster.getNode("node-4")!);

    runBehaviorTicks({ cluster, network, behavior, ticks: 12 });

    expect(cluster.leaderId).toBe("node-3");
    expect(cluster.getNode("node-3")).toMatchObject({ role: "leader", knownLeaderId: "node-3" });
    expect(cluster.getNode("node-4")).toMatchObject({ status: "down", role: "follower" });
  });

  test("candidate retries election when answer arrives without coordinator", () => {
    const cluster = new Cluster(3);
    const network = new Network(cluster, vi.fn());
    const behavior = new BullyNodeBehavior(cluster, network, vi.fn(), {
      heartbeatTimeoutMs: 300,
      electionTimeoutMs: 150
    });
    const candidate = cluster.getNode("node-2")!;

    candidate.knownLeaderId = "node-3";
    candidate.lastHeartbeatAtMs = 0;
    cluster.advanceTime(300);
    behavior.onTick(candidate);
    behavior.onMessage(candidate, {
      id: "message-answer",
      type: "answer",
      sourceNodeId: "node-3",
      targetNodeId: "node-2",
      sentAtMs: cluster.timeMs,
      deliverAtMs: cluster.timeMs,
      status: "delivered"
    });
    cluster.killNode("node-3");

    cluster.advanceTime(150);
    behavior.onTick(candidate);

    expect(cluster.leaderId).toBe("node-2");
    expect(candidate).toMatchObject({ role: "leader", knownLeaderId: "node-2", electionState: "idle" });
  });
});
