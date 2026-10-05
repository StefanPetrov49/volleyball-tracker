type LogContext = Record<string, unknown>;

function write(level: "info" | "warn" | "error", event: string, context: LogContext = {}) {
  console[level](
    JSON.stringify({
      time: new Date().toISOString(),
      level,
      event,
      ...context,
    }),
  );
}

export const log = {
  info(event: string, context?: LogContext) {
    write("info", event, context);
  },

  warn(event: string, context?: LogContext) {
    write("warn", event, context);
  },

  error(event: string, context?: LogContext) {
    write("error", event, context);
  },
};