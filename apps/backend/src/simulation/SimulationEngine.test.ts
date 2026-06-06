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

    expect(engine.applyCommand({ type: CLIENT_COMMAND_TYPES.NETWORK_HEAL_PARTITION })).toEqual({
      ok: false,
      error: {
        type: "error",
        message: "Command not implemented: network:healPartition"
      }
    });
    expect(onEvent).not.toHaveBeenCalled();
  });
});
