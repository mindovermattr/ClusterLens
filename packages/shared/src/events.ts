import { z } from "zod";
import {
  ClusterSnapshotSchema,
  EventLogEntrySchema,
  NetworkMessageSnapshotSchema,
  NodeSnapshotSchema
} from "./snapshots.js";

export const ServerEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("snapshot"),
    state: ClusterSnapshotSchema
  }),
  z.object({
    type: z.literal("node_updated"),
    node: NodeSnapshotSchema
  }),
  z.object({
    type: z.literal("message_sent"),
    message: NetworkMessageSnapshotSchema
  }),
  z.object({
    type: z.literal("message_delivered"),
    messageId: z.string()
  }),
  z.object({
    type: z.literal("leader_changed"),
    leaderId: z.string().nullable()
  }),
  z.object({
    type: z.literal("event_log"),
    entry: EventLogEntrySchema
  }),
  z.object({
    type: z.literal("error"),
    message: z.string()
  })
]);

export type ServerEvent = z.infer<typeof ServerEventSchema>;
