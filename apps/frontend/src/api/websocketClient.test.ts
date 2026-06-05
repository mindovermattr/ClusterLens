import { describe, expect, test } from "vitest";
import { createClusterWebSocketClient } from "./websocketClient";

class TestWebSocket extends EventTarget {
  static instances: TestWebSocket[] = [];
  readonly url: string;
  sent: string[] = [];

  constructor(url: string) {
    super();
    this.url = url;
    TestWebSocket.instances.push(this);
  }

  close(): void {
    this.dispatchEvent(new Event("close"));
  }

  emitOpen(): void {
    this.dispatchEvent(new Event("open"));
  }

  emitMessage(data: string): void {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
}

describe("createClusterWebSocketClient", () => {
  test("reports status changes and snapshot messages from the socket", () => {
    const statuses: string[] = [];
    const snapshots: unknown[] = [];

    const client = createClusterWebSocketClient({
      url: "ws://127.0.0.1:4173/ws",
      WebSocketConstructor: TestWebSocket as unknown as typeof WebSocket,
      onStatusChange: (status) => statuses.push(status),
      onSnapshot: (snapshot) => snapshots.push(snapshot)
    });

    const socket = TestWebSocket.instances[0];
    socket.emitOpen();
    socket.emitMessage('{"type":"snapshot","cluster":{"id":"smoke-cluster","nodes":[]}}');
    client.close();

    expect(socket.url).toBe("ws://127.0.0.1:4173/ws");
    expect(statuses).toEqual(["connecting", "connected", "disconnected"]);
    expect(snapshots).toEqual([
      {
        type: "snapshot",
        cluster: {
          id: "smoke-cluster",
          nodes: []
        }
      }
    ]);
  });
});
