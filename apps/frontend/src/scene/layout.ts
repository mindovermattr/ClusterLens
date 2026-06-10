import type { NetworkMessageSnapshot, NetworkPartitionSnapshot, NodeSnapshot } from "../domain/types";

export type ScenePosition = [number, number, number];

export type NodeLayoutEntry = {
  id: string;
  angle: number;
  position: ScenePosition;
};

export type EdgeState = "connected" | "blocked";

const DEFAULT_RADIUS = 4.2;
const MESSAGE_TIMEOUT_MS = 1800;

export function getNodeLayout(nodes: NodeSnapshot[], radius = DEFAULT_RADIUS): Map<string, NodeLayoutEntry> {
  const sortedNodes = [...nodes].sort((left, right) => left.id.localeCompare(right.id));
  const layout = new Map<string, NodeLayoutEntry>();

  sortedNodes.forEach((node, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(sortedNodes.length, 1)) * Math.PI * 2;
    const position: ScenePosition = [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];

    layout.set(node.id, { id: node.id, angle, position });
  });

  return layout;
}

export function getSceneEdges(nodeIds: string[]): Array<[string, string]> {
  const sortedNodeIds = [...nodeIds].sort((left, right) => left.localeCompare(right));
  const edges: Array<[string, string]> = [];

  for (let sourceIndex = 0; sourceIndex < sortedNodeIds.length; sourceIndex += 1) {
    for (let targetIndex = sourceIndex + 1; targetIndex < sortedNodeIds.length; targetIndex += 1) {
      edges.push([sortedNodeIds[sourceIndex], sortedNodeIds[targetIndex]]);
    }
  }

  return edges;
}

export function getEdgeState(
  sourceNodeId: string,
  targetNodeId: string,
  partitions: NetworkPartitionSnapshot[]
): EdgeState {
  for (const partition of partitions) {
    const sourceGroup = findPartitionGroupIndex(sourceNodeId, partition.groups);
    const targetGroup = findPartitionGroupIndex(targetNodeId, partition.groups);

    if (sourceGroup !== null && targetGroup !== null && sourceGroup !== targetGroup) {
      return "blocked";
    }
  }

  return "connected";
}

export function getMessageProgress(message: NetworkMessageSnapshot, nowMs: number): number {
  const durationMs = Math.max(message.deliverAtMs - message.sentAtMs, 1);
  const progress = (nowMs - message.sentAtMs) / durationMs;

  return Math.min(Math.max(progress, 0), 1);
}

export function isMessageVisible(message: NetworkMessageSnapshot, nowMs: number): boolean {
  return message.status === "pending" && nowMs <= message.deliverAtMs + MESSAGE_TIMEOUT_MS;
}

function findPartitionGroupIndex(nodeId: string, groups: string[][]): number | null {
  const groupIndex = groups.findIndex((group) => group.includes(nodeId));
  return groupIndex === -1 ? null : groupIndex;
}
