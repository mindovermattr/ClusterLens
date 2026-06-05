import type { FastifyInstance } from "fastify";
import { WebSocketServer } from "ws";
import type { SmokeClusterSnapshot } from "@clusterlens/shared";

const smokeSnapshot: SmokeClusterSnapshot = {
  type: "snapshot",
  cluster: {
    id: "smoke-cluster",
    nodes: [
      { id: "node-a", status: "online" },
      { id: "node-b", status: "online" },
      { id: "node-c", status: "online" }
    ]
  }
};

export async function registerWebSocketServer(server: FastifyInstance): Promise<void> {
  const websocketServer = new WebSocketServer({ noServer: true });

  websocketServer.on("connection", (socket) => {
    socket.send(JSON.stringify(smokeSnapshot));
  });

  server.server.on("upgrade", (request, socket, head) => {
    if (request.url !== "/ws") {
      socket.destroy();
      return;
    }

    websocketServer.handleUpgrade(request, socket, head, (client) => {
      websocketServer.emit("connection", client, request);
    });
  });

  server.addHook("onClose", async () => {
    websocketServer.close();
  });
}
