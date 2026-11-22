import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * The pooled Supabase URL ships with connection_limit=1, which serializes every
 * Promise.all of queries on one connection. Through the transaction pooler a
 * few connections per function instance are safe, so pages that fan out
 * (dashboard, inbox, leads) run their queries in parallel.
 */
function tunedDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.searchParams.get("pgbouncer") === "true" && url.searchParams.get("connection_limit") === "1") {
      url.searchParams.set("connection_limit", process.env.DB_CONNECTION_LIMIT?.trim() || "5");
      url.searchParams.set("pool_timeout", "15");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: tunedDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Reused across requests in the same warm instance (dev hot reload and serverless).
globalForPrisma.prisma = prisma;
