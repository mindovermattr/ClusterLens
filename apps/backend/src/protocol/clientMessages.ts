import { ClientCommandSchema, type ClientCommand } from "@clusterlens/shared";

export type ClientMessageParseResult =
  | {
      ok: true;
      command: ClientCommand;
    }
  | {
      ok: false;
    };

export function parseClientMessage(data: string): ClientMessageParseResult {
  try {
    const parsed = ClientCommandSchema.safeParse(JSON.parse(data));

    if (!parsed.success) {
      return { ok: false };
    }

    return {
      ok: true,
      command: parsed.data
    };
  } catch {
    return { ok: false };
  }
}
