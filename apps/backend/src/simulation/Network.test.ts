import { describe, expect, test, vi } from "vitest";
import { Cluster } from "./Cluster.js";
import { Network } from "./Network.js";

describe("Network", () => {
  test("delivers messages after configured latency", () => {
    const cluster = new Cluster(2);
    cluster.setLatency(50);
    const onEvent = vi.fn();
    const network = new Network(cluster, onEvent);

    network.send("heartbeat", "node-1", "node-2");

    expect(onEvent).toHaveBeenCalledWith({
      type: "message_sent",
      message: expect.objectContaining({
        type: "heartbeat",
        sourceNodeId: "node-1",
        targetNodeId: "node-2",
        deliverAtMs: 50,
        status: "pending"
      })
    });

    expect(network.deliverDue()).toEqual([]);

    cluster.advanceTime(50);
    expect(network.deliverDue()).toEqual([
      expect.objectContaining({ type: "heartbeat", sourceNodeId: "node-1", targetNodeId: "node-2" })
    ]);
    expect(onEvent).toHaveBeenCalledWith({
      type: "message_delivered",
      messageId: "message-1"
    });
    expect(cluster.network.messages[0]).toMatchObject({ id: "message-1", status: "delivered" });
  });

  test("drops messages to down nodes", () => {
    const cluster = new Cluster(2);
    const onEvent = vi.fn();
    const network = new Network(cluster, onEvent);
    cluster.killNode("node-2");

    network.send("election", "node-1", "node-2");

    cluster.advanceTime(200);
    expect(network.deliverDue()).toEqual([]);
    expect(cluster.network.messages[0]).toMatchObject({ status: "dropped" });
    expect(onEvent).toHaveBeenCalledWith({
      type: "message_dropped",
      messageId: "message-1"
    });
    expect(onEvent).toHaveBeenCalledWith({
      type: "event_log",
      entry: expect.objectContaining({
        eventType: "message_dropped",
        message: "election dropped from node-1 to node-2 because target node is down"
      })
    });
  });

  test("blocks only cross-group partition traffic", () => {
    const cluster = new Cluster(3);
    const onEvent = vi.fn();
    const network = new Network(cluster, onEvent);
    cluster.network.partitions = [{ groups: [["node-1"], ["node-2"]] }];

    network.send("election", "node-1", "node-2");
    network.send("election", "node-1", "node-3");

    cluster.advanceTime(200);
    expect(network.deliverDue()).toEqual([
      expect.objectContaining({ id: "message-2", targetNodeId: "node-3" })
    ]);
    expect(cluster.network.messages).toEqual([
      expect.objectContaining({ id: "message-1", status: "dropped" }),
      expect.objectContaining({ id: "message-2", status: "delivered" })
    ]);
    expect(onEvent).toHaveBeenCalledWith({
      type: "event_log",
      entry: expect.objectContaining({
        eventType: "message_dropped",
        message: "election dropped from node-1 to node-2 because partition blocked delivery",
        source: "node-1",
        target: "node-2"
      })
    });
  });

  test("healing a partition lets new messages deliver", () => {
    const cluster = new Cluster(2);
    const network = new Network(cluster, vi.fn());
    cluster.network.partitions = [{ groups: [["node-1"], ["node-2"]] }];

    network.send("heartbeat", "node-1", "node-2");
    cluster.advanceTime(200);
    expect(network.deliverDue()).toEqual([]);
    expect(cluster.network.messages[0]).toMatchObject({ status: "dropped" });

    cluster.network.partitions = [];
    network.send("heartbeat", "node-1", "node-2");
    cluster.advanceTime(200);

    expect(network.deliverDue()).toEqual([
      expect.objectContaining({ id: "message-2", sourceNodeId: "node-1", targetNodeId: "node-2" })
    ]);
    expect(cluster.network.messages[1]).toMatchObject({ status: "delivered" });
  });
});
