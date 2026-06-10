import type { NetworkMessageSnapshot, NetworkMessageType, ServerEvent } from "@clusterlens/shared";
import type { Cluster } from "./Cluster.js";

type NetworkEventEmitter = (event: ServerEvent) => void;

export class Network {
  private nextMessageId = 1;

  public constructor(
    private readonly cluster: Cluster,
    private readonly emit: NetworkEventEmitter
  ) {}

  public send(type: NetworkMessageType, sourceNodeId: string, targetNodeId: string): NetworkMessageSnapshot {
    const message: NetworkMessageSnapshot = {
      id: `message-${this.nextMessageId}`,
      type,
      sourceNodeId,
      targetNodeId,
      sentAtMs: this.cluster.timeMs,
      deliverAtMs: this.cluster.timeMs + this.cluster.network.latencyMs,
      status: "pending"
    };
    this.nextMessageId += 1;
    this.cluster.network.messages.push(message);
    this.emit({ type: "message_sent", message });
    this.emitEventLog("message_sent", `${type} sent from ${sourceNodeId} to ${targetNodeId}`, sourceNodeId, targetNodeId);
    return message;
  }

  public deliverDue(): NetworkMessageSnapshot[] {
    const delivered: NetworkMessageSnapshot[] = [];

    for (const message of this.cluster.network.messages) {
      if (message.status !== "pending" || message.deliverAtMs > this.cluster.timeMs) {
        continue;
      }

      const dropReason = this.getDropReason(message.sourceNodeId, message.targetNodeId);
      const lossReason = dropReason ? null : this.getLossReason();

      if (dropReason || lossReason) {
        message.status = "dropped";
        this.emit({ type: "message_dropped", messageId: message.id });
        this.emitEventLog(
          "message_dropped",
          `${message.type} dropped from ${message.sourceNodeId} to ${message.targetNodeId} because ${dropReason ?? lossReason}`,
          message.sourceNodeId,
          message.targetNodeId
        );
        continue;
      }

      message.status = "delivered";
      delivered.push(message);
      this.emit({ type: "message_delivered", messageId: message.id });
      this.emitEventLog(
        "message_delivered",
        `${message.type} delivered from ${message.sourceNodeId} to ${message.targetNodeId}`,
        message.sourceNodeId,
        message.targetNodeId
      );
    }

    return delivered;
  }

  public canDeliver(sourceNodeId: string, targetNodeId: string): boolean {
    return this.getDropReason(sourceNodeId, targetNodeId) === null;
  }

  public isPartitioned(sourceNodeId: string, targetNodeId: string): boolean {
    for (const partition of this.cluster.network.partitions) {
      const sourceGroupIndex = partition.groups.findIndex((group) => group.includes(sourceNodeId));
      const targetGroupIndex = partition.groups.findIndex((group) => group.includes(targetNodeId));
      if (sourceGroupIndex >= 0 && targetGroupIndex >= 0 && sourceGroupIndex !== targetGroupIndex) {
        return true;
      }
    }

    return false;
  }

  public reset(): void {
    this.nextMessageId = 1;
  }

  private isLost(): boolean {
    return this.cluster.network.packetLossRate > 0 && Math.random() < this.cluster.network.packetLossRate;
  }

  private getDropReason(sourceNodeId: string, targetNodeId: string): string | null {
    const source = this.cluster.getNode(sourceNodeId);
    const target = this.cluster.getNode(targetNodeId);

    if (source?.status !== "alive") {
      return "source node is down";
    }

    if (target?.status !== "alive") {
      return "target node is down";
    }

    if (this.isPartitioned(sourceNodeId, targetNodeId)) {
      return "partition blocked delivery";
    }

    return null;
  }

  private getLossReason(): string | null {
    return this.isLost() ? "packet loss triggered" : null;
  }

  private emitEventLog(
    eventType: Parameters<Cluster["createEventLogEntry"]>[0],
    message: string,
    source: string,
    target: string
  ): void {
    this.emit({
      type: "event_log",
      entry: this.cluster.createEventLogEntry(eventType, message, { source, target })
    });
  }
}
