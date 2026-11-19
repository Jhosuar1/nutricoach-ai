import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET(req) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ streak: 0 });

  const { searchParams } = new URL(req.url);
  const today = searchParams.get("today");
  const cursor = new Date(today + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today || "") ||
      !Number.isFinite(cursor.getTime()) || cursor.toISOString().slice(0, 10) !== today) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  let rows;
  try {
    rows = await sql`
      select d::text as day from (
        select app_date as d from meals where user_id = ${uid}
        union
        select app_date as d from water_logs where user_id = ${uid}
        union
        select completed_at as d from workout_completions where user_id = ${uid}
      ) x
      where d <= ${today}::date
      order by d desc
      limit 400
    `;
  } catch (error) {
    console.error("No se pudo consultar la racha", { code: error.code });
    return NextResponse.json({ error: "No se pudo cargar la racha" }, { status: 503 });
  }

  const activeDays = new Set(rows.map((r) => r.day));

  let streak = 0;

  // Si hoy todavía no tiene actividad, no rompe la racha: se cuenta desde ayer.
  if (!activeDays.has(today)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return NextResponse.json({ streak });
}
