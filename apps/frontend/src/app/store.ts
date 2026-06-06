import { create } from "zustand";
import type {
  ClusterSnapshot,
  ConnectionStatus,
  EventLogEntry,
  NetworkMessageSnapshot,
  NodeSnapshot
} from "../domain/types";

export const EVENT_LOG_LIMIT = 200;

type ClusterStoreState = {
  connectionStatus: ConnectionStatus;
  reconnectAttempt: number;
  snapshot: ClusterSnapshot | null;
  eventLog: EventLogEntry[];
  activeMessages: NetworkMessageSnapshot[];
  selectedNodeId: string | null;
  latencyDraftMs: number;
  lastError: string | null;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setReconnectAttempt: (attempt: number) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setLatencyDraftMs: (latencyMs: number) => void;
  handleSnapshot: (snapshot: ClusterSnapshot) => void;
  handleNodeUpdated: (node: NodeSnapshot) => void;
  handleMessageSent: (message: NetworkMessageSnapshot) => void;
  handleMessageDelivered: (messageId: string) => void;
  handleLeaderChanged: (leaderId: string | null) => void;
  handleEventLog: (entry: EventLogEntry) => void;
  handleError: (message: string) => void;
  resetStore: () => void;
};

const initialState = {
  connectionStatus: "connecting" as ConnectionStatus,
  reconnectAttempt: 0,
  snapshot: null,
  eventLog: [],
  activeMessages: [],
  selectedNodeId: null,
  latencyDraftMs: 200,
  lastError: null
};

function pendingMessages(messages: NetworkMessageSnapshot[]): NetworkMessageSnapshot[] {
  return messages.filter((message) => message.status === "pending");
}

function replaceNode(nodes: NodeSnapshot[], node: NodeSnapshot): NodeSnapshot[] {
  const existingIndex = nodes.findIndex((candidate) => candidate.id === node.id);

  if (existingIndex === -1) {
    return [...nodes, node];
  }

  return nodes.map((candidate) => (candidate.id === node.id ? node : candidate));
}

function boundEventLog(entries: EventLogEntry[]): EventLogEntry[] {
  return entries.slice(-EVENT_LOG_LIMIT);
}

export const useClusterStore = create<ClusterStoreState>((set) => ({
  ...initialState,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setLatencyDraftMs: (latencyDraftMs) => set({ latencyDraftMs }),
  handleSnapshot: (snapshot) =>
    set((state) => ({
      snapshot,
      activeMessages: pendingMessages(snapshot.network.messages),
      selectedNodeId: snapshot.nodes.some((node) => node.id === state.selectedNodeId) ? state.selectedNodeId : null,
      latencyDraftMs: snapshot.network.latencyMs,
      lastError: null
    })),
  handleNodeUpdated: (node) =>
    set((state) => {
      if (!state.snapshot) {
        return {};
      }

      return {
        snapshot: {
          ...state.snapshot,
          nodes: replaceNode(state.snapshot.nodes, node)
        }
      };
    }),
  handleMessageSent: (message) =>
    set((state) => {
      const activeMessages =
        message.status === "pending"
          ? [...state.activeMessages.filter((candidate) => candidate.id !== message.id), message]
          : state.activeMessages;

      if (!state.snapshot) {
        return { activeMessages };
      }

      return {
        activeMessages,
        snapshot: {
          ...state.snapshot,
          network: {
            ...state.snapshot.network,
            messages: [...state.snapshot.network.messages.filter((candidate) => candidate.id !== message.id), message]
          }
        }
      };
    }),
  handleMessageDelivered: (messageId) =>
    set((state) => ({
      activeMessages: state.activeMessages.filter((message) => message.id !== messageId),
      snapshot: state.snapshot
        ? {
            ...state.snapshot,
            network: {
              ...state.snapshot.network,
              messages: state.snapshot.network.messages.map((message) =>
                message.id === messageId ? { ...message, status: "delivered" } : message
              )
            }
          }
        : state.snapshot
    })),
  handleLeaderChanged: (leaderId) =>
    set((state) => ({
      snapshot: state.snapshot ? { ...state.snapshot, leaderId } : state.snapshot
    })),
  handleEventLog: (entry) =>
    set((state) => ({
      eventLog: boundEventLog([...state.eventLog, entry])
    })),
  handleError: (message) => set({ lastError: message }),
  resetStore: () => set(initialState)
}));
