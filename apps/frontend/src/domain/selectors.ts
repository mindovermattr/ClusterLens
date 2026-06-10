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
  if (!snapshot || snapshot.nodes.length < 2) {
    return null;
  }

  const nodeIds = snapshot.nodes.map((node) => node.id);
  const selectedIndex = selectedNodeId ? nodeIds.indexOf(selectedNodeId) : -1;
  const companionNodeId =
    selectedIndex >= 0 ? nodeIds.find((nodeId) => nodeId !== selectedNodeId) : null;
  const firstGroup =
    selectedIndex >= 0 && selectedNodeId && companionNodeId
      ? [selectedNodeId, companionNodeId]
      : nodeIds.slice(0, Math.min(2, nodeIds.length - 1));
  const otherNodeIds = nodeIds.filter((nodeId) => !firstGroup.includes(nodeId));

  if (otherNodeIds.length === 0) {
    return null;
  }

  return [firstGroup, otherNodeIds];
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
