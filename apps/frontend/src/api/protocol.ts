import { ServerEventSchema, type ServerEvent } from "@clusterlens/shared";

export type ServerEventHandlers = {
  onSnapshot: (snapshot: Extract<ServerEvent, { type: "snapshot" }>["state"]) => void;
  onNodeUpdated?: (node: Extract<ServerEvent, { type: "node_updated" }>["node"]) => void;
  onMessageSent?: (message: Extract<ServerEvent, { type: "message_sent" }>["message"]) => void;
  onMessageDelivered?: (messageId: string) => void;
  onMessageDropped?: (messageId: string) => void;
  onLeaderChanged?: (leaderId: string | null) => void;
  onEventLog?: (entry: Extract<ServerEvent, { type: "event_log" }>["entry"]) => void;
  onErrorEvent?: (event: Extract<ServerEvent, { type: "error" }>) => void;
};

export function parseServerEvent(data: string): ServerEvent | null {
  try {
    const parsed = ServerEventSchema.safeParse(JSON.parse(data));

    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function handleServerEvent(event: ServerEvent, handlers: ServerEventHandlers): void {
  switch (event.type) {
    case "snapshot":
      handlers.onSnapshot(event.state);
      return;
    case "node_updated":
      handlers.onNodeUpdated?.(event.node);
      return;
    case "message_sent":
      handlers.onMessageSent?.(event.message);
      return;
    case "message_delivered":
      handlers.onMessageDelivered?.(event.messageId);
      return;
    case "message_dropped":
      handlers.onMessageDropped?.(event.messageId);
      return;
    case "leader_changed":
      handlers.onLeaderChanged?.(event.leaderId);
      return;
    case "event_log":
      handlers.onEventLog?.(event.entry);
      return;
    case "error":
      handlers.onErrorEvent?.(event);
      return;
    default: {
      const exhaustiveEvent: never = event;
      return exhaustiveEvent;
    }
  }
}
