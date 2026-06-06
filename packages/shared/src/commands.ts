import { z } from "zod";

export const ClientCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("simulation:start")
  }),
  z.object({
    type: z.literal("simulation:pause")
  }),
  z.object({
    type: z.literal("simulation:reset"),
    nodeCount: z.number().int().positive().optional()
  }),
  z.object({
    type: z.literal("node:kill"),
    nodeId: z.string()
  }),
  z.object({
    type: z.literal("node:restore"),
    nodeId: z.string()
  }),
  z.object({
    type: z.literal("network:setLatency"),
    latencyMs: z.number().finite().nonnegative()
  }),
  z.object({
    type: z.literal("network:createPartition"),
    groups: z.array(z.array(z.string()).min(1)).min(2)
  }),
  z.object({
    type: z.literal("network:healPartition")
  })
]);

export type ClientCommand = z.infer<typeof ClientCommandSchema>;
