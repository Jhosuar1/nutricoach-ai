import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET(req) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ meals: [] });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  const rows = date
    ? await sql`select * from meals where user_id = ${uid} and app_date = ${date}::date order by created_at asc`
    : await sql`select * from meals where user_id = ${uid} and created_at::date = current_date order by created_at asc`;

  return NextResponse.json({ meals: rows });
}

export async function POST(req) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { type, items, totals, app_date } = await req.json();
  const rows = await sql`
    insert into meals (user_id, type, items, totals, app_date)
    values (${uid}, ${type}, ${JSON.stringify(items)}, ${JSON.stringify(totals)}, ${app_date || null})
    returning *
  `;
  return NextResponse.json({ meal: rows[0] });
}

export async function DELETE(req) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el id" }, { status: 400 });

  await sql`delete from meals where id = ${id} and user_id = ${uid}`;
  return NextResponse.json({ ok: true });
}
