import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import logger from "@/lib/logger";

declare global {
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
  // getCloudflareContext() uses AsyncLocalStorage and is safe to call inside
  // any async route handler or middleware running in a CF Worker.
  try {
    // Dynamic require avoids this import being evaluated at build-time in
    // environments that don't have the CF runtime available.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    if (env?.DB) {
      _client = new PrismaClient({ adapter: new PrismaD1(env.DB) });
      return _client;
    }
    // CF Worker runtime is present but DB binding is missing — this means
    // wrangler.toml [[d1_databases]] is not set or the binding name is wrong.
    // Throw immediately rather than silently falling through to a broken path.
    if (env !== undefined) {
      throw new Error(
        "Cloudflare D1 binding \"DB\" not found. Check [[d1_databases]] in wrangler.toml."
      );
    }
  } catch (err) {
    // Only re-throw binding-misconfiguration errors; swallow the
    // \"not a CF Worker\" error that occurs during local development.
    if (err instanceof Error && err.message.includes("D1 binding")) throw err;
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

