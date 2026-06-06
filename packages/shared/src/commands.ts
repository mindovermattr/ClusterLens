import { z } from "zod";

export const CLIENT_COMMAND_TYPES = {
  SIMULATION_START: "simulation:start",
  SIMULATION_PAUSE: "simulation:pause",
  SIMULATION_RESET: "simulation:reset",
  NODE_KILL: "node:kill",
  NODE_RESTORE: "node:restore",
  NETWORK_SET_LATENCY: "network:setLatency",
  NETWORK_CREATE_PARTITION: "network:createPartition",
  NETWORK_HEAL_PARTITION: "network:healPartition"
} as const;

export type ClientCommandType = (typeof CLIENT_COMMAND_TYPES)[keyof typeof CLIENT_COMMAND_TYPES];

export const ClientCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(CLIENT_COMMAND_TYPES.SIMULATION_START)
  }),
  z.object({
    type: z.literal(CLIENT_COMMAND_TYPES.SIMULATION_PAUSE)
  }),
  z.object({
    type: z.literal(CLIENT_COMMAND_TYPES.SIMULATION_RESET)
  }),
  z.object({
    type: z.literal(CLIENT_COMMAND_TYPES.NODE_KILL),
    nodeId: z.string()
  }),
  z.object({
    type: z.literal(CLIENT_COMMAND_TYPES.NODE_RESTORE),
    nodeId: z.string()
  }),
  z.object({
    type: z.literal(CLIENT_COMMAND_TYPES.NETWORK_SET_LATENCY),
    latencyMs: z.number().finite().nonnegative()
  }),
  z.object({
    type: z.literal(CLIENT_COMMAND_TYPES.NETWORK_CREATE_PARTITION),
    groups: z.array(z.array(z.string()).min(1)).min(2)
  }),
  z.object({
    type: z.literal(CLIENT_COMMAND_TYPES.NETWORK_HEAL_PARTITION)
  })
]);

export type ClientCommand = z.infer<typeof ClientCommandSchema>;
