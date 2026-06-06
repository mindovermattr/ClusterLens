import type { NetworkMessageSnapshot, ServerEvent } from "@clusterlens/shared";
import type { NodeBehavior } from "../NodeBehavior.js";
import type { Cluster } from "../../simulation/Cluster.js";
import type { ClusterNode } from "../../simulation/Node.js";
import type { Network } from "../../simulation/Network.js";
import { BULLY_MESSAGE_TYPES } from "./BullyMessages.js";

export type BullyNodeBehaviorOptions = {
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
  electionTimeoutMs?: number;
};

type ElectionTimers = {
  startedAtMs: number;
  answerReceived: boolean;
};

export class BullyNodeBehavior implements NodeBehavior {
  private readonly heartbeatIntervalMs: number;
  private readonly heartbeatTimeoutMs: number;
  private readonly electionTimeoutMs: number;
  private readonly lastHeartbeatSentAtMs = new Map<string, number>();
  private readonly elections = new Map<string, ElectionTimers>();

  public constructor(
    private readonly cluster: Cluster,
    private readonly network: Network,
    private readonly emit: (event: ServerEvent) => void,
    options: BullyNodeBehaviorOptions = {}
  ) {
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 250;
    this.heartbeatTimeoutMs = options.heartbeatTimeoutMs ?? 750;
    this.electionTimeoutMs = options.electionTimeoutMs ?? 300;
  }

  public onStart(): void {
    const currentLeader = this.cluster.leaderId ? this.cluster.getNode(this.cluster.leaderId) : undefined;
    if (currentLeader?.status === "alive") {
      currentLeader.role = "leader";
      currentLeader.knownLeaderId = currentLeader.id;
      currentLeader.lastHeartbeatAtMs = this.cluster.timeMs;
      return;
    }

    const starter = this.highestAliveNode();
    if (starter) {
      this.startElection(starter);
    }
  }

  public onStop(node?: ClusterNode): void {
    if (!node) {
      this.elections.clear();
      this.lastHeartbeatSentAtMs.clear();
      return;
    }

    this.elections.delete(node.id);
    this.lastHeartbeatSentAtMs.delete(node.id);
    if (this.cluster.leaderId === node.id) {
      this.setLeader(null);
    }
    if (node.status === "down" && !this.cluster.leaderId && this.cluster.running) {
      const starter = this.highestAliveNode();
      if (starter) {
        this.startElection(starter);
      }
    }
  }

  public onTick(node: ClusterNode): void {
    if (node.status !== "alive") {
      return;
    }

    if (node.role === "leader") {
      this.sendHeartbeats(node);
      return;
    }

    const election = this.elections.get(node.id);
    if (election && this.cluster.timeMs - election.startedAtMs >= this.electionTimeoutMs) {
      if (!election.answerReceived) {
        const higherNodes = this.higherReachableAliveNodes(node.id);
        if (higherNodes.length > 0) {
          election.startedAtMs = this.cluster.timeMs;
          for (const target of higherNodes) {
            this.network.send(BULLY_MESSAGE_TYPES.ELECTION, node.id, target.id);
          }
          return;
        }
        this.becomeLeader(node);
      } else {
        this.startElection(node);
      }
      return;
    }

    if (node.role === "candidate" || !node.knownLeaderId) {
      return;
    }

    const lastHeartbeatAtMs = node.lastHeartbeatAtMs ?? 0;
    if (this.cluster.timeMs - lastHeartbeatAtMs >= this.heartbeatTimeoutMs) {
      this.emitEventLog("heartbeat_timeout", `${node.id} timed out leader ${node.knownLeaderId}`, node.id, node.knownLeaderId);
      this.startElection(node);
    }
  }

  public onMessage(node: ClusterNode, message: NetworkMessageSnapshot): void {
    if (node.status !== "alive") {
      return;
    }

    switch (message.type) {
      case BULLY_MESSAGE_TYPES.HEARTBEAT:
        this.receiveLeaderSignal(node, message.sourceNodeId);
        break;
      case BULLY_MESSAGE_TYPES.ELECTION:
        this.network.send(BULLY_MESSAGE_TYPES.ANSWER, node.id, message.sourceNodeId);
        if (node.role !== "leader" && node.electionState === "idle") {
          this.startElection(node);
        }
        break;
      case BULLY_MESSAGE_TYPES.ANSWER:
        this.recordAnswer(node);
        break;
      case BULLY_MESSAGE_TYPES.COORDINATOR:
        this.receiveLeaderSignal(node, message.sourceNodeId);
        break;
    }
  }

  private startElection(node: ClusterNode): void {
    if (node.status !== "alive") {
      return;
    }

    node.role = "candidate";
    node.knownLeaderId = null;
    node.electionState = "waiting_for_answer";
    const higherNodes = this.higherReachableAliveNodes(node.id);
    this.elections.set(node.id, {
      startedAtMs: this.cluster.timeMs,
      answerReceived: false
    });

    this.emitEventLog("leader_changed", `${node.id} started election`, node.id);

    if (higherNodes.length === 0) {
      this.becomeLeader(node);
      return;
    }

    for (const target of higherNodes) {
      this.network.send(BULLY_MESSAGE_TYPES.ELECTION, node.id, target.id);
    }
  }

  private becomeLeader(node: ClusterNode): void {
    if (node.status !== "alive") {
      return;
    }

    for (const other of this.cluster.nodes.values()) {
      if (other.status === "alive" && other.id !== node.id && other.role === "leader") {
        other.role = "follower";
        other.knownLeaderId = node.id;
      }
    }

    node.role = "leader";
    node.knownLeaderId = node.id;
    node.lastHeartbeatAtMs = this.cluster.timeMs;
    node.electionState = "idle";
    this.elections.delete(node.id);
    if (this.cluster.leaderId !== node.id) {
      this.setLeader(node.id);
    }

    for (const target of this.aliveNodes()) {
      if (target.id !== node.id && this.network.canDeliver(node.id, target.id)) {
        this.network.send(BULLY_MESSAGE_TYPES.COORDINATOR, node.id, target.id);
      }
    }
  }

  private receiveLeaderSignal(node: ClusterNode, leaderId: string): void {
    const leader = this.cluster.getNode(leaderId);
    if (!leader || leader.status !== "alive") {
      return;
    }
    if (nodePriority(leaderId) < nodePriority(node.id)) {
      if (node.role !== "leader") {
        this.startElection(node);
      }
      return;
    }

    node.role = node.id === leaderId ? "leader" : "follower";
    node.knownLeaderId = leaderId;
    node.lastHeartbeatAtMs = this.cluster.timeMs;
    node.electionState = "idle";
    this.elections.delete(node.id);
    this.setLeader(leaderId);
  }

  private recordAnswer(node: ClusterNode): void {
    const election = this.elections.get(node.id);
    if (!election) {
      return;
    }

    election.answerReceived = true;
    node.electionState = "waiting_for_coordinator";
  }

  private sendHeartbeats(node: ClusterNode): void {
    const lastSentAtMs = this.lastHeartbeatSentAtMs.get(node.id) ?? -Infinity;
    if (this.cluster.timeMs - lastSentAtMs < this.heartbeatIntervalMs) {
      return;
    }

    this.lastHeartbeatSentAtMs.set(node.id, this.cluster.timeMs);
    for (const target of this.aliveNodes()) {
      if (target.id !== node.id && this.network.canDeliver(node.id, target.id)) {
        this.network.send(BULLY_MESSAGE_TYPES.HEARTBEAT, node.id, target.id);
      }
    }
  }

  private setLeader(leaderId: string | null): void {
    if (this.cluster.leaderId === leaderId) {
      return;
    }

    this.cluster.leaderId = leaderId;
    this.emit({ type: "leader_changed", leaderId });
    this.emitEventLog("leader_changed", leaderId ? `Leader changed to ${leaderId}` : "Leader cleared", leaderId);
  }

  private higherReachableAliveNodes(nodeId: string): ClusterNode[] {
    const priority = nodePriority(nodeId);
    return this.aliveNodes().filter((node) => nodePriority(node.id) > priority && this.network.canDeliver(nodeId, node.id));
  }

  private highestAliveNode(): ClusterNode | null {
    return this.aliveNodes().sort((left, right) => nodePriority(right.id) - nodePriority(left.id))[0] ?? null;
  }

  private aliveNodes(): ClusterNode[] {
    return [...this.cluster.nodes.values()].filter((node) => node.status === "alive");
  }

  private emitEventLog(
    eventType: Parameters<Cluster["createEventLogEntry"]>[0],
    message: string,
    source?: string | null,
    target?: string | null
  ): void {
    this.emit({
      type: "event_log",
      entry: this.cluster.createEventLogEntry(eventType, message, { source, target })
    });
  }
}

function nodePriority(nodeId: string): number {
  const match = /(\d+)$/.exec(nodeId);
  return match ? Number(match[1]) : 0;
}
