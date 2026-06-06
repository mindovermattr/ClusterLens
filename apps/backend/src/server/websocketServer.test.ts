import { once } from "node:events";
import { afterEach, describe, expect, test } from "vitest";
import WebSocket from "ws";
import { createHttpServer } from "./httpServer.js";

const servers: Array<Awaited<ReturnType<typeof createHttpServer>>> = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("websocket server", () => {
  test("sends a static snapshot when a client connects", async () => {
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
        leaderId: "node-c",
        nodes: [
          { id: "node-a", role: "follower", status: "alive" },
          { id: "node-b", role: "follower", status: "alive" },
          { id: "node-c", role: "leader", status: "alive" }
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
    socket.send(JSON.stringify({ type: "node:kill" }));

    const [message] = await once(socket, "message");
    socket.close();

    expect(JSON.parse(message.toString())).toEqual({
      type: "error",
      message: "Invalid client command"
    });
  });
});
