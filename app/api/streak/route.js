import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ streak: 0 });

  const { searchParams } = new URL(req.url);
  const today = searchParams.get("today");
  if (!today) return NextResponse.json({ error: "Falta today" }, { status: 400 });

  const rows = await sql`
    select distinct d::text as day from (
      select app_date as d from meals where user_id = ${uid}
      union
      select app_date as d from water_logs where user_id = ${uid}
      union
      select completed_at as d from workout_completions where user_id = ${uid}
    ) x
    where d is not null
    order by d desc
    limit 400
  `;
  const activeDays = new Set(rows.map((r) => r.day));

  let streak = 0;
  let cursor = new Date(today + "T00:00:00");

  // Si hoy todavía no tiene actividad, no rompe la racha: se cuenta desde ayer.
  if (!activeDays.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    if (activeDays.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return NextResponse.json({ streak });
}
