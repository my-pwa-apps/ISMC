import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import logger from "@/lib/logger";

// Declare the Cloudflare Workers bindings used by this app.
// Must match the [[d1_databases]] binding name in wrangler.toml.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface CloudflareEnv {
    DB: import("@cloudflare/workers-types").D1Database;
  }
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

// Lazily create the PrismaClient on first access.
// This is required because Cloudflare D1 is injected as a Worker binding that
// is only available inside a request context, not at module initialisation time.
let _client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (_client) return _client;

  // ---------- Cloudflare Pages / Workers ----------
  // getCloudflareContext() uses AsyncLocalStorage; safe to call inside any
  // async route handler running in a CF Worker (set up by OpenNext wrapper).
  try {
    const { env } = getCloudflareContext();
    if (env?.DB) {
      _client = new PrismaClient({ adapter: new PrismaD1(env.DB) });
      return _client;
    }
    if (env !== undefined) {
      throw new Error(
        "Cloudflare D1 binding \"DB\" not found. Check [[d1_databases]] in wrangler.toml."
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("D1 binding")) throw err;
    // getCloudflareContext() throws when called outside a CF Worker context
    // (local dev, CI). Fall through to the SQLite local-dev path below.
  }

  // ---------- Local development (SQLite file via DATABASE_URL) ----------
  if (globalThis.__prismaClient) {
    _client = globalThis.__prismaClient;
    return _client;
  }

  const client = new PrismaClient({
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "event" },
      { level: "warn", emit: "event" },
    ],
  });

  if (process.env.NODE_ENV === "development") {
    client.$on("query", (e: { query: string; duration: number }) => {
      if (e.duration > 200) {
        logger.warn({ query: e.query, durationMs: e.duration }, "Slow Prisma query");
      }
    });
  }

  client.$on("error", (e: { message: string }) => {
    logger.error({ message: e.message }, "Prisma error");
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__prismaClient = client;
  }

  _client = client;
  return _client;
}

// Export a Proxy so that existing `import db from "@/lib/db/client"` call sites
// don't need changes: property accesses (e.g. db.policySnapshot.findMany)
// trigger lazy initialisation the first time they're evaluated, which is always
// inside a request handler where the CF context is already available.
const db = new Proxy<PrismaClient>({} as PrismaClient, {
  get(_target, prop) {
    return (getClient() as never)[prop as keyof PrismaClient];
  },
});

export { db };
export default db;

