import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET() {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ completed: [] });

  const rows = await sql`
    select exercise_key from workout_completions
    where user_id = ${uid} and completed_at = current_date
  `;
  return NextResponse.json({ completed: rows.map((r) => r.exercise_key) });
}

export async function POST(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { exercise_key } = await req.json();
  const existing = await sql`
    select 1 from workout_completions
    where user_id = ${uid} and exercise_key = ${exercise_key} and completed_at = current_date
  `;

  if (existing.length > 0) {
    await sql`
      delete from workout_completions
      where user_id = ${uid} and exercise_key = ${exercise_key} and completed_at = current_date
    `;
  } else {
    await sql`
      insert into workout_completions (user_id, exercise_key) values (${uid}, ${exercise_key})
    `;
  }

  return NextResponse.json({ ok: true });
}
