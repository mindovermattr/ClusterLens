import { createHttpServer } from "./server/httpServer.js";

const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? "127.0.0.1";
const server = await createHttpServer();

await server.listen({ port, host });
console.log(`ClusterLens backend listening on http://${host}:${port}`);
