import { CLIENT_COMMAND_TYPES } from "@clusterlens/shared";
import { describe, expect, test, vi } from "vitest";
import { SimulationEngine } from "./SimulationEngine.js";

describe("SimulationEngine", () => {
  test("creates a default paused 5-node follower cluster", () => {
    const engine = new SimulationEngine();

    expect(engine.getSnapshot()).toEqual({
      timeMs: 0,
      running: false,
      leaderId: null,
      nodes: [
        { id: "node-1", role: "follower", status: "alive" },
        { id: "node-2", role: "follower", status: "alive" },
        { id: "node-3", role: "follower", status: "alive" },
        { id: "node-4", role: "follower", status: "alive" },
        { id: "node-5", role: "follower", status: "alive" }
      ],
      network: {
        latencyMs: 200,
        packetLossRate: 0,
        partitions: [],
        messages: []
      }
    });
  });

  test("advances time only while running", () => {
    const engine = new SimulationEngine({ tickIntervalMs: 50 });

    engine.tick();
    expect(engine.getSnapshot().timeMs).toBe(0);

    engine.start();
    engine.tick();
    expect(engine.getSnapshot().timeMs).toBe(50);

    engine.pause();
    engine.tick();
    expect(engine.getSnapshot().timeMs).toBe(50);
  });

  test("emits periodic snapshots while running", () => {
    const onEvent = vi.fn();
    const engine = new SimulationEngine({ tickIntervalMs: 50, snapshotIntervalMs: 100, onEvent });

    engine.start();
    engine.tick();
    engine.tick();

    expect(onEvent).toHaveBeenCalledWith({
      type: "snapshot",
      state: expect.objectContaining({ timeMs: 100, running: true })
    });
  });

  test("applies supported commands and emits state events", () => {
    const onEvent = vi.fn();
    const engine = new SimulationEngine({ onEvent });

    engine.applyCommand({ type: CLIENT_COMMAND_TYPES.SIMULATION_START });
    engine.applyCommand({ type: CLIENT_COMMAND_TYPES.NODE_KILL, nodeId: "node-2" });
    engine.applyCommand({ type: CLIENT_COMMAND_TYPES.NODE_RESTORE, nodeId: "node-2" });
    engine.applyCommand({ type: CLIENT_COMMAND_TYPES.NETWORK_SET_LATENCY, latencyMs: 75 });
    engine.applyCommand({ type: CLIENT_COMMAND_TYPES.NETWORK_CREATE_PARTITION, groups: [["node-1"], ["node-3"]] });
    engine.applyCommand({ type: CLIENT_COMMAND_TYPES.NETWORK_HEAL_PARTITION });
    engine.applyCommand({ type: CLIENT_COMMAND_TYPES.SIMULATION_RESET });

    expect(engine.getSnapshot()).toMatchObject({
      timeMs: 0,
      running: false,
      leaderId: null,
      nodes: [
        { id: "node-1", role: "follower", status: "alive" },
        { id: "node-2", role: "follower", status: "alive" },
        { id: "node-3", role: "follower", status: "alive" },
        { id: "node-4", role: "follower", status: "alive" },
        { id: "node-5", role: "follower", status: "alive" }
      ],
      network: { latencyMs: 200 }
    });

    expect(onEvent).toHaveBeenCalledWith({
      type: "node_updated",
      node: { id: "node-2", role: "follower", status: "down" }
    });
    expect(onEvent).toHaveBeenCalledWith({
      type: "node_updated",
      node: { id: "node-2", role: "follower", status: "alive" }
    });
    expect(onEvent).toHaveBeenCalledWith({
      type: "event_log",
      entry: expect.objectContaining({ eventType: "latency_changed", message: "Network latency set to 75ms" })
    });
    expect(onEvent).toHaveBeenCalledWith({
      type: "event_log",
      entry: expect.objectContaining({ eventType: "partition_created", message: "Network partition created" })
    });
    expect(onEvent).toHaveBeenCalledWith({
      type: "event_log",
      entry: expect.objectContaining({ eventType: "partition_healed", message: "Network partition healed" })
    });
  });

  test("elects the highest node on start and reelects after leader death", () => {
    const onEvent = vi.fn();
    const engine = new SimulationEngine({ tickIntervalMs: 100, nodeCount: 4, onEvent });

    engine.start();
    expect(engine.getSnapshot().leaderId).toBe("node-4");

    engine.applyCommand({ type: CLIENT_COMMAND_TYPES.NODE_KILL, nodeId: "node-4" });
    for (let index = 0; index < 12; index += 1) {
      engine.tick();
    }

    expect(engine.getSnapshot()).toMatchObject({
      leaderId: "node-3",
      nodes: [
        { id: "node-1", role: "follower", status: "alive" },
        { id: "node-2", role: "follower", status: "alive" },
        { id: "node-3", role: "leader", status: "alive" },
        { id: "node-4", role: "follower", status: "down" }
      ]
    });
    expect(onEvent).toHaveBeenCalledWith({ type: "leader_changed", leaderId: "node-4" });
    expect(onEvent).toHaveBeenCalledWith({ type: "leader_changed", leaderId: "node-3" });
    expect(
      onEvent.mock.calls
        .map(([event]) => event)
        .filter((event) => event.type === "leader_changed")
        .map((event) => event.leaderId)
    ).toEqual(["node-4", null, "node-3"]);
  });

  test("creates and heals network partitions", () => {
    const engine = new SimulationEngine();

    expect(engine.applyCommand({ type: CLIENT_COMMAND_TYPES.NETWORK_CREATE_PARTITION, groups: [["node-1"], ["node-2"]] })).toEqual({
      ok: true
    });
    expect(engine.getSnapshot().network.partitions).toEqual([{ groups: [["node-1"], ["node-2"]] }]);

    expect(engine.applyCommand({ type: CLIENT_COMMAND_TYPES.NETWORK_HEAL_PARTITION })).toEqual({ ok: true });
    expect(engine.getSnapshot().network.partitions).toEqual([]);
  });

  test("returns command errors without emitting them to global listeners", () => {
    const onEvent = vi.fn();
    const engine = new SimulationEngine({ onEvent });

    expect(engine.applyCommand({ type: CLIENT_COMMAND_TYPES.NODE_KILL, nodeId: "missing-node" })).toEqual({
      ok: false,
      error: {
        type: "error",
        message: "Unknown node id: missing-node"
      }
    });

    expect(onEvent).not.toHaveBeenCalled();
  });
});
