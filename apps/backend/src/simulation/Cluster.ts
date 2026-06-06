import type { ClusterSnapshot, EventLogEntry, EventLogType, NetworkSnapshot, NodeSnapshot } from "@clusterlens/shared";
import { ClusterNode } from "./Node.js";

export const DEFAULT_NODE_COUNT = 5;
export const DEFAULT_LATENCY_MS = 200;

export class Cluster {
  public timeMs = 0;
  public running = false;
  public leaderId: string | null = null;
  public readonly nodes = new Map<string, ClusterNode>();
  public network: NetworkSnapshot = createDefaultNetwork();

  public constructor(nodeCount = DEFAULT_NODE_COUNT) {
    this.reset(nodeCount);
  }

  public reset(nodeCount = DEFAULT_NODE_COUNT): void {
    this.timeMs = 0;
    this.running = false;
    this.leaderId = null;
    this.nodes.clear();
    this.network = createDefaultNetwork();

    for (let index = 1; index <= nodeCount; index += 1) {
      this.nodes.set(`node-${index}`, new ClusterNode(`node-${index}`));
    }
  }

  public advanceTime(deltaMs: number): void {
    this.timeMs += deltaMs;
  }

  public getNode(nodeId: string): ClusterNode | undefined {
    return this.nodes.get(nodeId);
  }

  public killNode(nodeId: string): NodeSnapshot | null {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return null;
    }

    node.kill();
    if (this.leaderId === nodeId) {
      this.leaderId = null;
    }

    return node.toSnapshot();
  }

  public restoreNode(nodeId: string): NodeSnapshot | null {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return null;
    }

    node.restore();
    return node.toSnapshot();
  }

  public setLatency(latencyMs: number): void {
    this.network = {
      ...this.network,
      latencyMs
    };
  }

  public createEventLogEntry(
    eventType: EventLogType,
    message: string,
    options: { source?: string | null; target?: string | null } = {}
  ): EventLogEntry {
    return {
      timestampMs: this.timeMs,
      eventType,
      source: options.source ?? null,
      target: options.target ?? null,
      message
    };
  }

  public toSnapshot(): ClusterSnapshot {
    return {
      timeMs: this.timeMs,
      running: this.running,
      leaderId: this.leaderId,
      nodes: [...this.nodes.values()].map((node) => node.toSnapshot()),
      network: {
        latencyMs: this.network.latencyMs,
        packetLossRate: this.network.packetLossRate,
        partitions: [...this.network.partitions],
        messages: [...this.network.messages]
      }
    };
  }
}

function createDefaultNetwork(): NetworkSnapshot {
  return {
    latencyMs: DEFAULT_LATENCY_MS,
    packetLossRate: 0,
    partitions: [],
    messages: []
  };
}
