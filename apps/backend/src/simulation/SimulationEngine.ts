import { CLIENT_COMMAND_TYPES, type ClientCommand, type ClusterSnapshot, type ServerEvent } from "@clusterlens/shared";
import { Cluster, DEFAULT_NODE_COUNT } from "./Cluster.js";
import { Scheduler } from "./Scheduler.js";

export type SimulationEventListener = (event: ServerEvent) => void;
export type CommandErrorEvent = Extract<ServerEvent, { type: "error" }>;
export type CommandResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: CommandErrorEvent;
    };

export type SimulationEngineOptions = {
  tickIntervalMs?: number;
  snapshotIntervalMs?: number;
  nodeCount?: number;
  autoTick?: boolean;
  onEvent?: SimulationEventListener;
};

export class SimulationEngine {
  private readonly tickIntervalMs: number;
  private readonly snapshotIntervalMs: number;
  private readonly listeners = new Set<SimulationEventListener>();
  private readonly scheduler = new Scheduler();
  private readonly cluster: Cluster;
  private interval: NodeJS.Timeout | null = null;

  public constructor(options: SimulationEngineOptions = {}) {
    this.tickIntervalMs = options.tickIntervalMs ?? 100;
    this.snapshotIntervalMs = options.snapshotIntervalMs ?? 500;
    this.cluster = new Cluster(options.nodeCount ?? DEFAULT_NODE_COUNT);

    if (options.onEvent) {
      this.listeners.add(options.onEvent);
    }

    this.scheduleNextSnapshot();

    if (options.autoTick) {
      this.startTickLoop();
    }
  }

  public subscribe(listener: SimulationEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public start(): void {
    if (this.cluster.running) {
      return;
    }

    this.cluster.running = true;
    this.emitEventLog("simulation_started", "Simulation started");
    this.emitSnapshot();
  }

  public pause(): void {
    if (!this.cluster.running) {
      return;
    }

    this.cluster.running = false;
    this.emitEventLog("simulation_paused", "Simulation paused");
    this.emitSnapshot();
  }

  public reset(nodeCount = DEFAULT_NODE_COUNT): void {
    this.cluster.reset(nodeCount);
    this.scheduler.clear();
    this.scheduleNextSnapshot();
    this.emitEventLog("simulation_reset", "Simulation reset");
    this.emitSnapshot();
  }

  public tick(): void {
    if (!this.cluster.running) {
      return;
    }

    this.cluster.advanceTime(this.tickIntervalMs);
    this.scheduler.runDue(this.cluster.timeMs);
  }

  public applyCommand(command: ClientCommand): CommandResult {
    switch (command.type) {
      case CLIENT_COMMAND_TYPES.SIMULATION_START:
        this.start();
        return { ok: true };
      case CLIENT_COMMAND_TYPES.SIMULATION_PAUSE:
        this.pause();
        return { ok: true };
      case CLIENT_COMMAND_TYPES.SIMULATION_RESET:
        this.reset();
        return { ok: true };
      case CLIENT_COMMAND_TYPES.NODE_KILL:
        return this.killNode(command.nodeId);
      case CLIENT_COMMAND_TYPES.NODE_RESTORE:
        return this.restoreNode(command.nodeId);
      case CLIENT_COMMAND_TYPES.NETWORK_SET_LATENCY:
        this.cluster.setLatency(command.latencyMs);
        this.emitEventLog("latency_changed", `Network latency set to ${command.latencyMs}ms`);
        this.emitSnapshot();
        return { ok: true };
      case CLIENT_COMMAND_TYPES.NETWORK_CREATE_PARTITION:
      case CLIENT_COMMAND_TYPES.NETWORK_HEAL_PARTITION:
        return this.commandError(`Command not implemented: ${command.type}`);
    }
  }

  public getSnapshot(): ClusterSnapshot {
    return this.cluster.toSnapshot();
  }

  public startTickLoop(): void {
    if (this.interval) {
      return;
    }

    this.interval = setInterval(() => {
      this.tick();
    }, this.tickIntervalMs);
  }

  public stopTickLoop(): void {
    if (!this.interval) {
      return;
    }

    clearInterval(this.interval);
    this.interval = null;
  }

  private killNode(nodeId: string): CommandResult {
    const node = this.cluster.killNode(nodeId);
    if (!node) {
      return this.commandError(`Unknown node id: ${nodeId}`);
    }

    this.emit({ type: "node_updated", node });
    this.emitEventLog("node_killed", `Node ${nodeId} killed`, { source: nodeId });
    this.emitSnapshot();
    return { ok: true };
  }

  private restoreNode(nodeId: string): CommandResult {
    const node = this.cluster.restoreNode(nodeId);
    if (!node) {
      return this.commandError(`Unknown node id: ${nodeId}`);
    }

    this.emit({ type: "node_updated", node });
    this.emitEventLog("node_restored", `Node ${nodeId} restored`, { source: nodeId });
    this.emitSnapshot();
    return { ok: true };
  }

  private scheduleNextSnapshot(): void {
    this.scheduler.scheduleIn(this.cluster.timeMs, this.snapshotIntervalMs, () => {
      this.emitSnapshot();
      this.scheduleNextSnapshot();
    });
  }

  private emitSnapshot(): void {
    this.emit({
      type: "snapshot",
      state: this.cluster.toSnapshot()
    });
  }

  private emitEventLog(
    eventType: Parameters<Cluster["createEventLogEntry"]>[0],
    message: string,
    options?: Parameters<Cluster["createEventLogEntry"]>[2]
  ): void {
    this.emit({
      type: "event_log",
      entry: this.cluster.createEventLogEntry(eventType, message, options)
    });
  }

  private commandError(message: string): CommandResult {
    return {
      ok: false,
      error: {
        type: "error",
        message
      }
    };
  }

  private emit(event: ServerEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
