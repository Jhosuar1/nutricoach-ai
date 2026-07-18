import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { calcProfile } from "@/lib/nutrition";

export async function GET() {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ profile: null, authenticated: false });

  const rows = await sql`select * from profiles where user_id = ${uid}`;
  if (rows.length === 0) return NextResponse.json({ profile: null, authenticated: true });

  const profile = rows[0];
  const targets = calcProfile(profile);
  return NextResponse.json({ profile, targets, authenticated: true });
}

export async function POST(req) {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const body = await req.json();
  const {
    name, sex, age, height, weight, targetWeight,
    activity, goal, place, trainDays, equipment,
  } = body;

  await sql`
    insert into profiles
      (user_id, name, sex, age, height, weight, target_weight, activity, goal, place, train_days, equipment, updated_at)
    values
      (${uid}, ${name}, ${sex}, ${age}, ${height}, ${weight}, ${targetWeight}, ${activity}, ${goal}, ${place}, ${trainDays}, ${JSON.stringify(equipment || [])}, now())
    on conflict (user_id) do update set
      name = excluded.name,
      sex = excluded.sex,
      age = excluded.age,
      height = excluded.height,
      weight = excluded.weight,
      target_weight = excluded.target_weight,
      activity = excluded.activity,
      goal = excluded.goal,
      place = excluded.place,
      train_days = excluded.train_days,
      equipment = excluded.equipment,
      updated_at = now()
  `;

  const rows = await sql`select * from profiles where user_id = ${uid}`;
  const targets = calcProfile(rows[0]);
  return NextResponse.json({ profile: rows[0], targets });
}
