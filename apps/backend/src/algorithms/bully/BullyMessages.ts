import type { NetworkMessageType } from "@clusterlens/shared";

export const BULLY_MESSAGE_TYPES = {
  HEARTBEAT: "heartbeat",
  ELECTION: "election",
  ANSWER: "answer",
  COORDINATOR: "coordinator"
} as const satisfies Record<string, NetworkMessageType>;
