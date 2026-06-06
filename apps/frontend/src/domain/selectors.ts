import type { ClusterSnapshot, NodeSnapshot } from "./types";

export function selectLeader(snapshot: ClusterSnapshot | null): NodeSnapshot | null {
  if (!snapshot?.leaderId) {
    return null;
  }

  return snapshot.nodes.find((node) => node.id === snapshot.leaderId) ?? null;
}

export function selectSelectedNode(snapshot: ClusterSnapshot | null, selectedNodeId: string | null): NodeSnapshot | null {
  if (!snapshot || !selectedNodeId) {
    return null;
  }

  return snapshot.nodes.find((node) => node.id === selectedNodeId) ?? null;
}

export function selectPartitionGroups(snapshot: ClusterSnapshot | null, selectedNodeId: string | null): string[][] | null {
  if (!snapshot || !selectedNodeId) {
    return null;
  }

  const otherNodeIds = snapshot.nodes.map((node) => node.id).filter((nodeId) => nodeId !== selectedNodeId);

  if (otherNodeIds.length === 0) {
    return null;
  }

  return [[selectedNodeId], otherNodeIds];
}

export function formatDurationMs(timeMs: number | null | undefined): string {
  if (typeof timeMs !== "number") {
    return "unknown";
  }

  if (timeMs < 1000) {
    return `${timeMs}ms`;
  }

  return `${(timeMs / 1000).toFixed(1)}s`;
}
