import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET() {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ logs: [] });

  const rows = await sql`
    select id, weight, created_at from weight_logs
    where user_id = ${uid}
    order by created_at asc
  `;
  return NextResponse.json({ logs: rows });
}

export async function POST(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { weight } = await req.json();
  const rows = await sql`
    insert into weight_logs (user_id, weight) values (${uid}, ${weight}) returning *
  `;
  await sql`update profiles set weight = ${weight}, updated_at = now() where user_id = ${uid}`;
  return NextResponse.json({ log: rows[0] });
}
