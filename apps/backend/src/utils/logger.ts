type LogLevel = "debug" | "info" | "warn" | "error";

function write(level: LogLevel, message: string, data?: unknown): void {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;

  if (data === undefined) {
    console[level === "debug" ? "log" : level](line);
    return;
  }

  console[level === "debug" ? "log" : level](line, data);
}

export const logger = {
  debug: (message: string, data?: unknown) => write("debug", message, data),
  info: (message: string, data?: unknown) => write("info", message, data),
  warn: (message: string, data?: unknown) => write("warn", message, data),
  error: (message: string, data?: unknown) => write("error", message, data)
};
