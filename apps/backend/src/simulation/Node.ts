import type { NodeRole, NodeSnapshot, NodeStatus } from "@clusterlens/shared";

export type ElectionState = "idle" | "waiting_for_answer" | "waiting_for_coordinator";

export class ClusterNode {
  public status: NodeStatus = "alive";
  public role: NodeRole = "follower";
  public lastHeartbeatAtMs: number | null = null;
  public knownLeaderId: string | null = null;
  public electionState: ElectionState = "idle";

  public constructor(public readonly id: string) {}

  public kill(): void {
    this.status = "down";
    this.role = "follower";
    this.knownLeaderId = null;
    this.electionState = "idle";
  }

  public restore(): void {
    this.status = "alive";
    this.role = "follower";
    this.knownLeaderId = null;
    this.electionState = "idle";
  }

  public toSnapshot(): NodeSnapshot {
    return {
      id: this.id,
      role: this.role,
      status: this.status
    };
  }
}
