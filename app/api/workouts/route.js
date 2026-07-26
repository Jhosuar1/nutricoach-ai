import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ completed: [] });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  const rows = date
    ? await sql`select exercise_key from workout_completions where user_id = ${uid} and completed_at = ${date}::date`
    : await sql`select exercise_key from workout_completions where user_id = ${uid} and completed_at = current_date`;

  return NextResponse.json({ completed: rows.map((r) => r.exercise_key) });
}

export async function POST(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { exercise_key, app_date } = await req.json();
  const date = app_date || null;

  const existing = date
    ? await sql`select 1 from workout_completions where user_id = ${uid} and exercise_key = ${exercise_key} and completed_at = ${date}::date`
    : await sql`select 1 from workout_completions where user_id = ${uid} and exercise_key = ${exercise_key} and completed_at = current_date`;

  if (existing.length > 0) {
    if (date) {
      await sql`delete from workout_completions where user_id = ${uid} and exercise_key = ${exercise_key} and completed_at = ${date}::date`;
    } else {
      await sql`delete from workout_completions where user_id = ${uid} and exercise_key = ${exercise_key} and completed_at = current_date`;
    }
  } else if (date) {
    await sql`insert into workout_completions (user_id, exercise_key, completed_at) values (${uid}, ${exercise_key}, ${date}::date)`;
  } else {
    await sql`insert into workout_completions (user_id, exercise_key) values (${uid}, ${exercise_key})`;
  }

  return NextResponse.json({ ok: true });
}
