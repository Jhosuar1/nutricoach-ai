import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ days: [] });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year"), 10);
  const month = parseInt(searchParams.get("month"), 10);
  if (!year || !month) return NextResponse.json({ error: "Faltan year y month" }, { status: 400 });

  const start = `${year}-${String(month).padStart(2, "0")}-01`;

  const rows = await sql`
    select distinct d::text as day from (
      select app_date as d from meals where user_id = ${uid}
      union
      select app_date as d from water_logs where user_id = ${uid}
      union
      select completed_at as d from workout_completions where user_id = ${uid}
      union
      select app_date as d from weight_logs where user_id = ${uid}
    ) x
    where d >= ${start}::date and d < (${start}::date + interval '1 month')
    order by d
  `;

  return NextResponse.json({ days: rows.map((r) => r.day) });
}
