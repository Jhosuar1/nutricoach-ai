import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET() {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ meals: [] });

  const rows = await sql`
    select * from meals
    where user_id = ${uid} and created_at::date = current_date
    order by created_at asc
  `;
  return NextResponse.json({ meals: rows });
}

export async function POST(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { type, items, totals } = await req.json();
  const rows = await sql`
    insert into meals (user_id, type, items, totals)
    values (${uid}, ${type}, ${JSON.stringify(items)}, ${JSON.stringify(totals)})
    returning *
  `;
  return NextResponse.json({ meal: rows[0] });
}
