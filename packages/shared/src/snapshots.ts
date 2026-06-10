import { z } from "zod";

export const NodeRoleSchema = z.enum(["follower", "candidate", "leader"]);
export type NodeRole = z.infer<typeof NodeRoleSchema>;

export const NodeStatusSchema = z.enum(["alive", "down"]);
export type NodeStatus = z.infer<typeof NodeStatusSchema>;

export const NetworkMessageTypeSchema = z.enum(["heartbeat", "election", "answer", "coordinator"]);
export type NetworkMessageType = z.infer<typeof NetworkMessageTypeSchema>;

export const NetworkMessageDeliveryStatusSchema = z.enum(["pending", "delivered", "dropped"]);
export type NetworkMessageDeliveryStatus = z.infer<typeof NetworkMessageDeliveryStatusSchema>;

export const EventLogTypeSchema = z.enum([
  "simulation_started",
  "simulation_paused",
  "simulation_reset",
  "node_killed",
  "node_restored",
  "latency_changed",
  "partition_created",
  "partition_healed",
  "message_sent",
  "message_delivered",
  "message_dropped",
  "leader_changed",
  "heartbeat_timeout"
]);
export type EventLogType = z.infer<typeof EventLogTypeSchema>;

export const NodeSnapshotSchema = z.object({
  id: z.string(),
  role: NodeRoleSchema,
  status: NodeStatusSchema
});
export type NodeSnapshot = z.infer<typeof NodeSnapshotSchema>;

export const NetworkMessageSnapshotSchema = z.object({
  id: z.string(),
  type: NetworkMessageTypeSchema,
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  sentAtMs: z.number().finite().nonnegative(),
  deliverAtMs: z.number().finite().nonnegative(),
  status: NetworkMessageDeliveryStatusSchema
});
export type NetworkMessageSnapshot = z.infer<typeof NetworkMessageSnapshotSchema>;

export const NetworkPartitionSnapshotSchema = z.object({
  groups: z.array(z.array(z.string()).min(1)).min(2)
});
export type NetworkPartitionSnapshot = z.infer<typeof NetworkPartitionSnapshotSchema>;

export const NetworkSnapshotSchema = z.object({
  latencyMs: z.number().finite().nonnegative(),
  packetLossRate: z.number().finite().min(0).max(1),
  partitions: z.array(NetworkPartitionSnapshotSchema),
  messages: z.array(NetworkMessageSnapshotSchema)
});
export type NetworkSnapshot = z.infer<typeof NetworkSnapshotSchema>;

export const EventLogEntrySchema = z.object({
  timestampMs: z.number().finite().nonnegative(),
  eventType: EventLogTypeSchema,
  source: z.string().nullable(),
  target: z.string().nullable(),
  message: z.string()
});
export type EventLogEntry = z.infer<typeof EventLogEntrySchema>;

export const ClusterSnapshotSchema = z.object({
  timeMs: z.number().finite().nonnegative(),
  running: z.boolean(),
  leaderId: z.string().nullable(),
  nodes: z.array(NodeSnapshotSchema),
  network: NetworkSnapshotSchema
});
export type ClusterSnapshot = z.infer<typeof ClusterSnapshotSchema>;
