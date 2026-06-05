import Fastify from "fastify";
import { registerWebSocketServer } from "./websocketServer.js";

export async function createHttpServer() {
  const server = Fastify();

  server.get("/health", async () => ({ ok: true }));
  await registerWebSocketServer(server);

  return server;
}
