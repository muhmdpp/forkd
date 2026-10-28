import { migrate } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";
import { createDb } from "./client";

const db = createDb();
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

console.log("Running migrations…");
await migrate(db, { migrationsFolder });
console.log("Migrations complete.");
await db.$client.end();
