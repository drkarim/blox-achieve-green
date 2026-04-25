/**
 * migrate.mjs — Run all pending Drizzle migrations at startup.
 * Called by the Railway start command before launching the server.
 *
 * Usage: node scripts/migrate.mjs
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const connection = await mysql.createConnection(connectionString);
const db = drizzle(connection);

const migrationsFolder = path.resolve(__dirname, "../drizzle");
console.log(`[migrate] Running migrations from: ${migrationsFolder}`);

await migrate(db, { migrationsFolder });
console.log("[migrate] All migrations applied successfully.");

await connection.end();
