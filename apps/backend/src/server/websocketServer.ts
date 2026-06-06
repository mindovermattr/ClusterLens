import type { FastifyInstance } from "fastify";
import { WebSocket, WebSocketServer } from "ws";
import { parseClientMessage } from "../protocol/clientMessages.js";
import { createErrorEvent, createSnapshotEvent, serializeServerEvent } from "../protocol/serverEvents.js";
import { SimulationEngine } from "../simulation/SimulationEngine.js";
import { logger } from "../utils/logger.js";

export async function registerWebSocketServer(instance: FastifyInstance) {
  const websocketServer = new WebSocketServer({ noServer: true });
  const engine = new SimulationEngine({ autoTick: true });

  engine.subscribe((event) => {
    broadcast(websocketServer, serializeServerEvent(event));
  });

  websocketServer.on("connection", (socket) => {
    socket.send(serializeServerEvent(createSnapshotEvent(engine.getSnapshot())));

    socket.on("message", (data) => {
      const command = parseClientMessage(data.toString());

      if (!command.ok) {
        socket.send(serializeServerEvent(createErrorEvent("Invalid client command")));
        logger.warn("Invalid client command received");
        return;
      }

      const result = engine.applyCommand(command.command);

      if (!result.ok) {
        socket.send(serializeServerEvent(result.error));
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
    engine.stopTickLoop();
    websocketServer.close();
  });
}

function broadcast(websocketServer: WebSocketServer, message: string): void {
  for (const client of websocketServer.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
