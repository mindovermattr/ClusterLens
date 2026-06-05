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
      cluster: {
        id: "smoke-cluster",
        nodes: [
          { id: "node-a", status: "online" },
          { id: "node-b", status: "online" },
          { id: "node-c", status: "online" }
        ]
      }
    });
  });
});
