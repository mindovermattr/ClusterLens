import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ClusterSnapshot } from "@clusterlens/shared";
import { createClusterWebSocketClient } from "./websocketClient";

class TestWebSocket extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  static instances: TestWebSocket[] = [];
  readonly url: string;
  readyState = TestWebSocket.CONNECTING;
  sent: string[] = [];

  constructor(url: string) {
    super();
    this.url = url;
    TestWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = TestWebSocket.CLOSED;
    this.dispatchEvent(new Event("close"));
  }

  emitOpen(): void {
    this.readyState = TestWebSocket.OPEN;
    this.dispatchEvent(new Event("open"));
  }

  emitError(): void {
    this.dispatchEvent(new Event("error"));
  }

  emitMessage(data: string): void {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
}

describe("createClusterWebSocketClient", () => {
  beforeEach(() => {
    TestWebSocket.instances = [];
    vi.useRealTimers();
  });

  test("reports status changes and snapshot messages from the socket", () => {
    const statuses: string[] = [];
    const snapshots: ClusterSnapshot[] = [];

    const client = createClusterWebSocketClient({
      url: "ws://127.0.0.1:4173/ws",
      WebSocketConstructor: TestWebSocket as unknown as typeof WebSocket,
      onStatusChange: (status) => statuses.push(status),
      onSnapshot: (snapshot) => snapshots.push(snapshot)
    });

    const socket = TestWebSocket.instances[0];
    socket.emitOpen();
    socket.emitMessage(
      '{"type":"snapshot","state":{"timeMs":0,"running":false,"leaderId":null,"nodes":[],"network":{"latencyMs":200,"packetLossRate":0,"partitions":[],"messages":[]}}}'
    );
    client.close();

    expect(socket.url).toBe("ws://127.0.0.1:4173/ws");
    expect(statuses).toEqual(["connecting", "connected", "disconnected"]);
    expect(snapshots).toEqual([
      {
        timeMs: 0,
        running: false,
        leaderId: null,
        nodes: [],
        network: {
          latencyMs: 200,
          packetLossRate: 0,
          partitions: [],
          messages: []
        }
      }
    ]);
  });

  test("handles all server event types and ignores malformed messages", () => {
    const snapshots: ClusterSnapshot[] = [];
    const deliveredMessages: string[] = [];
    const errors: string[] = [];

    createClusterWebSocketClient({
      url: "ws://127.0.0.1:4173/ws",
      WebSocketConstructor: TestWebSocket as unknown as typeof WebSocket,
      onStatusChange: () => {},
      onSnapshot: (snapshot) => snapshots.push(snapshot),
      onMessageDelivered: (messageId) => deliveredMessages.push(messageId),
      onErrorEvent: (event) => errors.push(event.message)
    });

    const socket = TestWebSocket.instances.at(-1);
    socket?.emitMessage('{"type":"node_updated","node":{"id":"node-a","role":"candidate","status":"alive"}}');
    socket?.emitMessage(
      '{"type":"message_sent","message":{"id":"message-1","type":"heartbeat","sourceNodeId":"node-a","targetNodeId":"node-b","sentAtMs":0,"deliverAtMs":200,"status":"pending"}}'
    );
    socket?.emitMessage('{"type":"message_delivered","messageId":"message-1"}');
    socket?.emitMessage('{"type":"leader_changed","leaderId":"node-a"}');
    socket?.emitMessage(
      '{"type":"event_log","entry":{"timestampMs":0,"eventType":"leader_changed","source":"node-a","target":null,"message":"node-a became leader"}}'
    );
    socket?.emitMessage('{"type":"error","message":"Invalid client command"}');
    socket?.emitMessage('{"type":"snapshot","state":{"nodes":[]}}');
    socket?.emitMessage('{"type":"event"}');
    socket?.emitMessage("not json");

    expect(snapshots).toEqual([]);
    expect(deliveredMessages).toEqual(["message-1"]);
    expect(errors).toEqual(["Invalid client command"]);
  });

  test("sends typed client commands only while connected", () => {
    const client = createClusterWebSocketClient({
      url: "ws://127.0.0.1:4173/ws",
      WebSocketConstructor: TestWebSocket as unknown as typeof WebSocket,
      onStatusChange: () => {},
      onSnapshot: () => {}
    });

    const socket = TestWebSocket.instances.at(-1)!;

    expect(client.sendCommand({ type: "simulation:start" })).toBe(false);

    socket.emitOpen();

    expect(client.sendCommand({ type: "node:kill", nodeId: "node-a" })).toBe(true);
    expect(socket.sent).toEqual(['{"type":"node:kill","nodeId":"node-a"}']);
  });

  test("reconnects after an unexpected close and reports attempts", () => {
    vi.useFakeTimers();
    const statuses: string[] = [];
    const attempts: number[] = [];

    const client = createClusterWebSocketClient({
      url: "ws://127.0.0.1:4173/ws",
      WebSocketConstructor: TestWebSocket as unknown as typeof WebSocket,
      reconnectDelayMs: 1000,
      onReconnectAttempt: (attempt) => attempts.push(attempt),
      onStatusChange: (status) => statuses.push(status),
      onSnapshot: () => {}
    });

    const firstSocket = TestWebSocket.instances.at(-1)!;
    firstSocket.emitOpen();
    firstSocket.close();

    vi.advanceTimersByTime(1000);

    expect(TestWebSocket.instances).toHaveLength(2);
    expect(attempts).toEqual([1]);
    expect(statuses).toEqual(["connecting", "connected", "disconnected", "connecting"]);

    client.disconnect();
    vi.useRealTimers();
  });

  test("does not create duplicate sockets when connect is called repeatedly", () => {
    const client = createClusterWebSocketClient({
      url: "ws://127.0.0.1:4173/ws",
      WebSocketConstructor: TestWebSocket as unknown as typeof WebSocket,
      onStatusChange: () => {},
      onSnapshot: () => {}
    });

    client.connect();
    const socket = TestWebSocket.instances.at(-1)!;
    socket.emitOpen();
    client.connect();

    expect(TestWebSocket.instances).toHaveLength(1);
  });

  test("closes errored sockets and reconnects through the close handler", () => {
    vi.useFakeTimers();
    const statuses: string[] = [];
    const attempts: number[] = [];

    const client = createClusterWebSocketClient({
      url: "ws://127.0.0.1:4173/ws",
      WebSocketConstructor: TestWebSocket as unknown as typeof WebSocket,
      reconnectDelayMs: 1000,
      onReconnectAttempt: (attempt) => attempts.push(attempt),
      onStatusChange: (status) => statuses.push(status),
      onSnapshot: () => {}
    });

    const socket = TestWebSocket.instances.at(-1)!;
    socket.emitOpen();
    socket.emitError();

    vi.advanceTimersByTime(1000);

    expect(socket.readyState).toBe(TestWebSocket.CLOSED);
    expect(TestWebSocket.instances).toHaveLength(2);
    expect(attempts).toEqual([1]);
    expect(statuses).toEqual(["connecting", "connected", "disconnected", "connecting"]);

    client.disconnect();
    vi.useRealTimers();
  });

  test("ignores stale socket close after a newer socket is active", () => {
    vi.useFakeTimers();
    const statuses: string[] = [];
    const attempts: number[] = [];

    const client = createClusterWebSocketClient({
      url: "ws://127.0.0.1:4173/ws",
      WebSocketConstructor: TestWebSocket as unknown as typeof WebSocket,
      reconnectDelayMs: 1000,
      onReconnectAttempt: (attempt) => attempts.push(attempt),
      onStatusChange: (status) => statuses.push(status),
      onSnapshot: () => {}
    });

    const firstSocket = TestWebSocket.instances.at(-1)!;
    firstSocket.emitOpen();
    firstSocket.close();
    vi.advanceTimersByTime(1000);

    const secondSocket = TestWebSocket.instances.at(-1)!;
    secondSocket.emitOpen();
    firstSocket.close();
    vi.advanceTimersByTime(1000);

    expect(TestWebSocket.instances).toHaveLength(2);
    expect(attempts).toEqual([1]);
    expect(statuses).toEqual(["connecting", "connected", "disconnected", "connecting", "connected"]);

    client.disconnect();
    vi.useRealTimers();
  });

  test("ignores stale socket messages after replacement and disconnect", () => {
    vi.useFakeTimers();
    const snapshots: ClusterSnapshot[] = [];

    const client = createClusterWebSocketClient({
      url: "ws://127.0.0.1:4173/ws",
      WebSocketConstructor: TestWebSocket as unknown as typeof WebSocket,
      reconnectDelayMs: 1000,
      onStatusChange: () => {},
      onSnapshot: (snapshot) => snapshots.push(snapshot)
    });

    const firstSocket = TestWebSocket.instances.at(-1)!;
    firstSocket.emitOpen();
    firstSocket.close();
    vi.advanceTimersByTime(1000);

    const secondSocket = TestWebSocket.instances.at(-1)!;
    secondSocket.emitOpen();
    firstSocket.emitMessage(
      '{"type":"snapshot","state":{"timeMs":0,"running":false,"leaderId":null,"nodes":[],"network":{"latencyMs":200,"packetLossRate":0,"partitions":[],"messages":[]}}}'
    );
    client.disconnect();
    secondSocket.emitMessage(
      '{"type":"snapshot","state":{"timeMs":100,"running":true,"leaderId":null,"nodes":[],"network":{"latencyMs":200,"packetLossRate":0,"partitions":[],"messages":[]}}}'
    );

    expect(snapshots).toEqual([]);
    vi.useRealTimers();
  });
});
