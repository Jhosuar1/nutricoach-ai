import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.warn(
    "[nutricoach] Falta DATABASE_URL. Configúrala en .env.local (desarrollo) o en Vercel (producción)."
  );
}

export const sql = neon(process.env.DATABASE_URL);
