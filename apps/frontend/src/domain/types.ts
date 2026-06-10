import type {
  ClientCommand,
  ClusterSnapshot,
  ConnectionStatus,
  EventLogEntry,
  NetworkPartitionSnapshot,
  NetworkMessageSnapshot,
  NodeSnapshot
} from "@clusterlens/shared";

export type {
  ClientCommand,
  ClusterSnapshot,
  ConnectionStatus,
  EventLogEntry,
  NetworkPartitionSnapshot,
  NetworkMessageSnapshot,
  NodeSnapshot
};

export type UiState = {
  selectedNodeId: string | null;
  latencyDraftMs: number;
  lastError: string | null;
};
