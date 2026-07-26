import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ meals: [], water_ml: 0, weight: null, workouts: [] });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Falta la fecha" }, { status: 400 });

  const meals = await sql`
    select * from meals where user_id = ${uid} and app_date = ${date}::date order by created_at asc
  `;
  const waterRows = await sql`
    select coalesce(sum(amount_ml), 0) as total from water_logs
    where user_id = ${uid} and app_date = ${date}::date
  `;
  const weightRows = await sql`
    select weight from weight_logs
    where user_id = ${uid} and app_date = ${date}::date
    order by created_at desc limit 1
  `;
  const workoutRows = await sql`
    select exercise_key from workout_completions
    where user_id = ${uid} and completed_at = ${date}::date
  `;

  return NextResponse.json({
    meals,
    water_ml: Number(waterRows[0].total),
    weight: weightRows[0] ? Number(weightRows[0].weight) : null,
    workouts: workoutRows.map((r) => r.exercise_key),
  });
}
