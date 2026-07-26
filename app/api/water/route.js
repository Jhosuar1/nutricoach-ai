import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ total_ml: 0 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  const rows = date
    ? await sql`select coalesce(sum(amount_ml), 0) as total from water_logs where user_id = ${uid} and app_date = ${date}::date`
    : await sql`select coalesce(sum(amount_ml), 0) as total from water_logs where user_id = ${uid} and created_at::date = current_date`;

  return NextResponse.json({ total_ml: Number(rows[0].total) });
}

export async function POST(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { amount_ml, app_date } = await req.json();
  await sql`insert into water_logs (user_id, amount_ml, app_date) values (${uid}, ${amount_ml}, ${app_date || null})`;
  return NextResponse.json({ ok: true });
}
