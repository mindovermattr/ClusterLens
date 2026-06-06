import type { NetworkMessageSnapshot } from "@clusterlens/shared";
import type { ClusterNode } from "../simulation/Node.js";

export interface NodeBehavior {
  onStart(): void;
  onStop(node?: ClusterNode): void;
  onTick(node: ClusterNode): void;
  onMessage(node: ClusterNode, message: NetworkMessageSnapshot): void;
}
