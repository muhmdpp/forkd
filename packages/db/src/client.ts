import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DEMO_MIGRATIONS, DEMO_SEED } from "./demo-sql.generated";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema> & { $client: postgres.Sql };

/** True when no DATABASE_URL is set: the app runs on a built-in in-memory Postgres with sample data. */
export const isDemoMode = !process.env.DATABASE_URL;

export function createDb(url = process.env.DATABASE_URL): Database {
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  const client = postgres(url, { max: Number(process.env.DB_POOL_SIZE ?? 10), prepare: false });
  return drizzle(client, { schema, casing: "snake_case" });
}

/**
 * Demo database: in-memory Postgres (PGlite) loaded with the schema and the Kozhikode sample data.
 * The setup runs as the first statement on the connection, and PGlite runs statements in order,
 * so every later query waits for it. Data lives only as long as the server process.
 */
function createDemoDb(): Database {
  const pg = new PGlite();
  void pg.exec([...DEMO_MIGRATIONS, DEMO_SEED].join(";\n")).catch((err) => {
    console.error("[forkd] demo database setup failed", err);
  });
  // Same query builder API; only the raw `execute` result shape differs (see rowsOf).
  return drizzlePglite(pg, { schema, casing: "snake_case" }) as unknown as Database;
}

/** postgres-js returns rows as an array; PGlite returns { rows }. */
export function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return ((result as { rows?: T[] }).rows ?? []) as T[];
}

// Reuse one pool across hot reloads in development and warm serverless invocations.
const g = globalThis as unknown as { __forkdDb?: Database };

export function getDb(): Database {
  if (!g.__forkdDb) {
    if (isDemoMode) console.warn("[forkd] DATABASE_URL not set: running in demo mode with an in-memory database.");
    g.__forkdDb = isDemoMode ? createDemoDb() : createDb();
  }
  return g.__forkdDb;
}
