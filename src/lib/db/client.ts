import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client/http";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import logger from "@/lib/logger";

declare global {
  // Allow global caching of the Prisma client in development to prevent
  // exhausting the database connection pool due to hot-module reloading.
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  // Use Turso/libSQL over HTTP when TURSO_DATABASE_URL is set.
  // Required for Cloudflare Pages/Workers (no local filesystem access).
  if (process.env.TURSO_DATABASE_URL) {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }

  // Local development: standard Prisma client using DATABASE_URL (SQLite file).
  return new PrismaClient({
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "event" },
      { level: "warn", emit: "event" },
    ],
  });
}

const prismaClientSingleton = (): PrismaClient => {
  const client = createPrismaClient();

  // Log slow queries in development
  if (process.env.NODE_ENV === "development") {
    // @ts-expect-error – Prisma event types are correct at runtime
    client.$on("query", (e: { query: string; duration: number }) => {
      if (e.duration > 200) {
        logger.warn({ query: e.query, durationMs: e.duration }, "Slow Prisma query");
      }
    });
  }

  // @ts-expect-error – Prisma event types are correct at runtime
  client.$on("error", (e: { message: string }) => {
    logger.error({ message: e.message }, "Prisma error");
  });

  return client;
};

export const db =
  globalThis.__prismaClient ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = db;
}

export default db;
