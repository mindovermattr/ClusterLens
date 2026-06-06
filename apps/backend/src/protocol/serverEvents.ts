import { ServerEventSchema, type ClusterSnapshot, type ServerEvent } from "@clusterlens/shared";

export function createSnapshotEvent(state: ClusterSnapshot): ServerEvent {
  return {
    type: "snapshot",
    state
  };
}

export function createErrorEvent(message: string): ServerEvent {
  return {
    type: "error",
    message
  };
}

export function serializeServerEvent(event: ServerEvent): string {
  return JSON.stringify(ServerEventSchema.parse(event));
}
