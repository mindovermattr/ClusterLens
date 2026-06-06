import { useEffect, useState } from "react";
import type { ClusterSnapshot, ConnectionStatus } from "@clusterlens/shared";
import { createClusterWebSocketClient } from "../api/websocketClient";

const backendWebSocketUrl = import.meta.env.VITE_BACKEND_WS_URL ?? "ws://127.0.0.1:4173/ws";

export function App() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [snapshot, setSnapshot] = useState<ClusterSnapshot | null>(null);

  useEffect(() => {
    const client = createClusterWebSocketClient({
      url: backendWebSocketUrl,
      onStatusChange: setStatus,
      onSnapshot: setSnapshot
    });

    return () => client.close();
  }, []);

  return (
    <main>
      <section>
        <h1>ClusterLens</h1>
        <p>WebSocket status: {status}</p>
      </section>

      <section>
        <h2>Smoke Snapshot</h2>
        {snapshot ? (
          <pre>{JSON.stringify(snapshot, null, 2)}</pre>
        ) : (
          <p>Waiting for backend snapshot.</p>
        )}
      </section>
    </main>
  );
}
