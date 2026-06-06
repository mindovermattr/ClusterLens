import type { FastifyInstance } from "fastify";
import { WebSocketServer } from "ws";
import { parseClientMessage } from "../protocol/clientMessages.js";
import { createErrorEvent, createSnapshotEvent, serializeServerEvent } from "../protocol/serverEvents.js";

export async function registerWebSocketServer(instance: FastifyInstance) {
  const websocketServer = new WebSocketServer({ noServer: true });

  websocketServer.on("connection", (socket) => {
    socket.send(serializeServerEvent(createSnapshotEvent()));

    socket.on("message", (data) => {
      const command = parseClientMessage(data.toString());

      if (!command.ok) {
        socket.send(serializeServerEvent(createErrorEvent("Invalid client command")));
      }
    });
  });

  instance.server.on("upgrade", (request, socket, head) => {
    if (request.url !== "/ws") {
      socket.destroy();
      return;
    }

    websocketServer.handleUpgrade(request, socket, head, (client) => {
      websocketServer.emit("connection", client, request);
    });
  });

  instance.addHook("onClose", async () => {
    websocketServer.close();
  });
}
