import { createDatabaseConnection } from "../database/connection.js";
import { createEnv } from "../env.js";
import { roles } from "../database/schema.js";

const env = createEnv({ serviceName: "database-seed", defaultPort: 1 });
const db = createDatabaseConnection(env);
await db.insert(roles).values(["admin", "marca", "client", "tendero", "delivery"].map((name) => ({ name }))).onConflictDoNothing();
await db.pool.end();
