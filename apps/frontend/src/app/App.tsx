import { useEffect, useRef } from "react";
import { createClusterWebSocketClient } from "../api/websocketClient";
import { useClusterStore } from "./store";
import { ControlPanel } from "../panels/ControlPanel";
import { ClusterStatePanel } from "../panels/ClusterStatePanel";
import { EventLogPanel } from "../panels/EventLogPanel";
import { ClusterScene } from "../scene/ClusterScene";
import type { ClientCommand } from "../domain/types";

const backendWebSocketUrl = import.meta.env.VITE_BACKEND_WS_URL ?? "ws://127.0.0.1:4173/ws";
type ClusterWebSocketClient = ReturnType<typeof createClusterWebSocketClient>;

export function App() {
  const clientRef = useRef<ClusterWebSocketClient | null>(null);
  const connectionStatus = useClusterStore((state) => state.connectionStatus);
  const reconnectAttempt = useClusterStore((state) => state.reconnectAttempt);
  const snapshot = useClusterStore((state) => state.snapshot);
  const activeMessages = useClusterStore((state) => state.activeMessages);
  const eventLog = useClusterStore((state) => state.eventLog);
  const selectedNodeId = useClusterStore((state) => state.selectedNodeId);
  const latencyDraftMs = useClusterStore((state) => state.latencyDraftMs);
  const lastError = useClusterStore((state) => state.lastError);
  const setConnectionStatus = useClusterStore((state) => state.setConnectionStatus);
  const setReconnectAttempt = useClusterStore((state) => state.setReconnectAttempt);
  const setSelectedNodeId = useClusterStore((state) => state.setSelectedNodeId);
  const setLatencyDraftMs = useClusterStore((state) => state.setLatencyDraftMs);
  const handleSnapshot = useClusterStore((state) => state.handleSnapshot);
  const handleNodeUpdated = useClusterStore((state) => state.handleNodeUpdated);
  const handleMessageSent = useClusterStore((state) => state.handleMessageSent);
  const handleMessageDelivered = useClusterStore((state) => state.handleMessageDelivered);
  const handleLeaderChanged = useClusterStore((state) => state.handleLeaderChanged);
  const handleEventLog = useClusterStore((state) => state.handleEventLog);
  const handleError = useClusterStore((state) => state.handleError);

  useEffect(() => {
    const client = createClusterWebSocketClient({
      url: backendWebSocketUrl,
      onStatusChange: setConnectionStatus,
      onReconnectAttempt: setReconnectAttempt,
      onSnapshot: handleSnapshot,
      onNodeUpdated: handleNodeUpdated,
      onMessageSent: handleMessageSent,
      onMessageDelivered: handleMessageDelivered,
      onLeaderChanged: handleLeaderChanged,
      onEventLog: handleEventLog,
      onErrorEvent: (event) => handleError(event.message)
    });

    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [
    handleError,
    handleEventLog,
    handleLeaderChanged,
    handleMessageDelivered,
    handleMessageSent,
    handleNodeUpdated,
    handleSnapshot,
    setConnectionStatus,
    setReconnectAttempt
  ]);

  function sendCommand(command: ClientCommand): boolean {
    return clientRef.current?.sendCommand(command) ?? false;
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>ClusterLens</h1>
          <p>
            Backend {connectionStatus}
            {connectionStatus !== "connected" && reconnectAttempt > 0 ? `, reconnect ${reconnectAttempt}` : ""}
          </p>
        </div>
        {lastError ? <p className="error-banner">{lastError}</p> : null}
      </header>

      <div className="workspace-grid">
        <ClusterScene
          snapshot={snapshot}
          activeMessages={activeMessages}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />

        <div className="side-panel-stack">
          <ControlPanel
            connectionStatus={connectionStatus}
            snapshot={snapshot}
            selectedNodeId={selectedNodeId}
            latencyDraftMs={latencyDraftMs}
            onLatencyDraftChange={setLatencyDraftMs}
            onCommand={sendCommand}
          />
          <ClusterStatePanel snapshot={snapshot} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
        </div>

        <EventLogPanel entries={eventLog} />
      </div>
    </main>
  );
}
