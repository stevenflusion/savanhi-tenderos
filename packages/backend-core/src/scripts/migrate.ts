import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabaseConnection } from "../database/connection.js";
import { createEnv } from "../env.js";

const env = createEnv({ serviceName: "database-migration", defaultPort: 1 });
const db = createDatabaseConnection(env);
await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
await db.pool.end();
