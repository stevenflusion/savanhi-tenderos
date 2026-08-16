import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { schema } from "./schema.js";
import type { BackendEnv } from "../types/env.js";

export type DatabaseConnection = NodePgDatabase<typeof schema> & {
  pool: pg.Pool;
};

export function createDatabaseConnection(env: BackendEnv): DatabaseConnection {
  const pool = new pg.Pool({ connectionString: env.databaseUrl });
  return Object.assign(drizzle(pool, { schema }), {
    pool,
  }) as DatabaseConnection;
}
