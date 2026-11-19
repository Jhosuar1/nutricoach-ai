import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (process.env.VERCEL_ENV === "production" || process.argv.includes("--apply")) {
  if (!process.env.DATABASE_URL) throw new Error("Configura DATABASE_URL para migrar Comunidad.");
  const sql = neon(process.env.DATABASE_URL);
  const migration = await readFile(new URL("../migrations/community.sql", import.meta.url), "utf8");
  const statements = migration.split(";").map((statement) => statement.trim()).filter(Boolean);
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(583682419)`,
    ...statements.map((statement) => sql(statement, [])),
  ]);
  console.log("Migración de Comunidad aplicada.");
}
