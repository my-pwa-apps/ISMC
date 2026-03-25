/**
 * Structured logger using pino.
 *
 * In development, output is pretty-printed.
 * In production, output is newline-delimited JSON (for ingestion by
 * Azure Monitor, Datadog, or any log aggregator).
 *
 * Usage:
 *   import logger from "@/lib/logger";
 *   logger.info({ policyId: "..." }, "Policy loaded");
 *   logger.error({ err }, "Graph call failed");
 */

import pino from "pino";

const isDev = process.env.NODE_ENV === "development";
const isPretty = process.env.LOG_PRETTY === "true";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isDev && isPretty
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
  base: {
    app: "ismc",
    env: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development",
  },
  // Redact secrets from logs
  redact: {
    paths: [
      "access_token",
      "refresh_token",
      "id_token",
      "client_secret",
      "password",
      "authorization",
      "*.authorization",
      "*.access_token",
    ],
    censor: "[REDACTED]",
  },
});

export default logger;

/** Create a child logger scoped to a specific module or request */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
