import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET() {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ total_ml: 0 });

  const rows = await sql`
    select coalesce(sum(amount_ml), 0) as total from water_logs
    where user_id = ${uid} and created_at::date = current_date
  `;
  return NextResponse.json({ total_ml: Number(rows[0].total) });
}

export async function POST(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { amount_ml } = await req.json();
  await sql`insert into water_logs (user_id, amount_ml) values (${uid}, ${amount_ml})`;
  return NextResponse.json({ ok: true });
}
