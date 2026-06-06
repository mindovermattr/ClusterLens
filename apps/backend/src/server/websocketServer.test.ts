import { once } from "node:events";
import { CLIENT_COMMAND_TYPES } from "@clusterlens/shared";
import { afterEach, describe, expect, test } from "vitest";
import WebSocket from "ws";
import { createHttpServer } from "./httpServer.js";

const servers: Array<Awaited<ReturnType<typeof createHttpServer>>> = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("websocket server", () => {
  test("sends the current simulation snapshot when a client connects", async () => {
    const server = await createHttpServer();
    servers.push(server);

    const address = await server.listen({ port: 0, host: "127.0.0.1" });
    const url = address.replace("http://", "ws://");
    const socket = new WebSocket(`${url}/ws`);

    const [message] = await once(socket, "message");
    socket.close();

    expect(JSON.parse(message.toString())).toEqual({
      type: "snapshot",
      state: {
        timeMs: 0,
        running: false,
        leaderId: null,
        nodes: [
          { id: "node-1", role: "follower", status: "alive" },
          { id: "node-2", role: "follower", status: "alive" },
          { id: "node-3", role: "follower", status: "alive" },
          { id: "node-4", role: "follower", status: "alive" },
          { id: "node-5", role: "follower", status: "alive" }
        ],
        network: {
          latencyMs: 200,
          packetLossRate: 0,
          partitions: [],
          messages: []
        }
      }
    });
  });

  test("returns an error event for invalid client commands", async () => {
    const server = await createHttpServer();
    servers.push(server);

    const address = await server.listen({ port: 0, host: "127.0.0.1" });
    const url = address.replace("http://", "ws://");
    const socket = new WebSocket(`${url}/ws`);

    await once(socket, "message");
    socket.send(JSON.stringify({ type: CLIENT_COMMAND_TYPES.NODE_KILL }));

    const [message] = await once(socket, "message");
    socket.close();

    expect(JSON.parse(message.toString())).toEqual({
      type: "error",
      message: "Invalid client command"
    });
  });

  test("applies valid client commands and broadcasts simulation events", async () => {
    const server = await createHttpServer();
    servers.push(server);

    const address = await server.listen({ port: 0, host: "127.0.0.1" });
    const url = address.replace("http://", "ws://");
    const socket = new WebSocket(`${url}/ws`);

    await once(socket, "message");
    const nextMessages = collectMessagesByType(socket, ["node_updated", "event_log"]);
    socket.send(JSON.stringify({ type: CLIENT_COMMAND_TYPES.NODE_KILL, nodeId: "node-3" }));

    const messages = await nextMessages;
    socket.close();

    expect(messages.node_updated).toEqual({
      type: "node_updated",
      node: { id: "node-3", role: "follower", status: "down" }
    });
    expect(messages.event_log).toEqual({
      type: "event_log",
      entry: {
        timestampMs: 0,
        eventType: "node_killed",
        source: "node-3",
        target: null,
        message: "Node node-3 killed"
      }
    });
  });

  test("returns an error event for valid commands with invalid node ids", async () => {
    const server = await createHttpServer();
    servers.push(server);

    const address = await server.listen({ port: 0, host: "127.0.0.1" });
    const url = address.replace("http://", "ws://");
    const socket = new WebSocket(`${url}/ws`);

    await once(socket, "message");
    socket.send(JSON.stringify({ type: CLIENT_COMMAND_TYPES.NODE_RESTORE, nodeId: "missing-node" }));

    const [message] = await once(socket, "message");
    socket.close();

    expect(JSON.parse(message.toString())).toEqual({
      type: "error",
      message: "Unknown node id: missing-node"
    });
  });

  test("sends command-specific errors only to the issuing socket", async () => {
    const server = await createHttpServer();
    servers.push(server);

    const address = await server.listen({ port: 0, host: "127.0.0.1" });
    const url = address.replace("http://", "ws://");
    const firstSocket = new WebSocket(`${url}/ws`);
    const secondSocket = new WebSocket(`${url}/ws`);

    await Promise.all([once(firstSocket, "message"), once(secondSocket, "message")]);

    const firstError = collectMessagesByType(firstSocket, ["error"]);
    const secondUnexpectedError = rejectOnMessageType(secondSocket, "error", 100);
    firstSocket.send(JSON.stringify({ type: CLIENT_COMMAND_TYPES.NODE_RESTORE, nodeId: "missing-node" }));

    await expect(firstError).resolves.toEqual({
      error: {
        type: "error",
        message: "Unknown node id: missing-node"
      }
    });
    await expect(secondUnexpectedError).resolves.toBeUndefined();

    firstSocket.close();
    secondSocket.close();
  });
});

async function collectMessagesByType<T extends string>(
  socket: WebSocket,
  types: T[]
): Promise<Record<T, Record<string, unknown>>> {
  return new Promise((resolve) => {
    const messages = {} as Record<T, Record<string, unknown>>;
    const wantedTypes = new Set<string>(types);

    socket.on("message", (message) => {
      const parsed = JSON.parse(message.toString()) as Record<string, unknown>;
      const type = parsed.type;

      if (typeof type === "string" && wantedTypes.has(type)) {
        messages[type as T] = parsed;
      }

      if (types.every((eventType) => messages[eventType])) {
        resolve(messages);
      }
    });
  });
}

async function rejectOnMessageType(socket: WebSocket, type: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, timeoutMs);

    socket.on("message", (message) => {
      const parsed = JSON.parse(message.toString()) as Record<string, unknown>;

      if (parsed.type === type) {
        clearTimeout(timeout);
        reject(new Error(`Unexpected ${type} event`));
      }
    });
  });
}
