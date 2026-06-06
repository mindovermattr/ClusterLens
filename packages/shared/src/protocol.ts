import type { ClientCommand } from "./commands.js";
import type { ServerEvent } from "./events.js";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export type ClientProtocolMessage = ClientCommand;
export type ServerProtocolMessage = ServerEvent;
