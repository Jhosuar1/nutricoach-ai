import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { ACTIVITY, GOALS, calcProfile } from "@/lib/nutrition";
import { trainingPreferences } from "@/lib/preferences";

export async function GET() {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ profile: null, authenticated: false });

  const rows = await sql`select * from profiles where user_id = ${uid}`;
  if (rows.length === 0) return NextResponse.json({ profile: null, authenticated: true });

  const profile = rows[0];
  const targets = calcProfile(profile);
  return NextResponse.json({ profile, targets, authenticated: true });
}

export async function POST(req) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  const {
    name, sex, age, height, weight, targetWeight,
    activity, goal, place, trainDays, equipment, wakeTime,
  } = body;

  const validNumber = (value, min, max) => value !== "" && value != null &&
    Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;
  if (typeof name !== "string" || !name.trim() || name.length > 80 ||
      !["hombre", "mujer"].includes(sex) || !validNumber(age, 13, 120) || !Number.isInteger(Number(age)) ||
      !validNumber(height, 80, 250) || !validNumber(weight, 20, 500) || !validNumber(targetWeight, 20, 500) ||
      !Object.hasOwn(ACTIVITY, activity) || !Object.hasOwn(GOALS, goal) ||
      !["casa", "gimnasio", "ambos"].includes(place) || !validNumber(trainDays, 1, 7) || !Number.isInteger(Number(trainDays)) ||
      (wakeTime && !/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(wakeTime))) {
    return NextResponse.json({ error: "Revisa los datos de tu perfil." }, { status: 400 });
  }
  const preferences = trainingPreferences(body.preferences);
  if (body.preferences?.professional === true && body.preferences.calorieTarget !== "" &&
      body.preferences.calorieTarget != null && preferences.calorieTarget === null) {
    return NextResponse.json({ error: "Escribe la meta profesional como un número entero válido o deja el campo vacío." }, { status: 400 });
  }

  const [profile] = await sql`
    insert into profiles
      (user_id, name, sex, age, height, weight, target_weight, activity, goal, place, train_days, equipment, wake_time, preferences, updated_at)
    values
      (${uid}, ${name}, ${sex}, ${age}, ${height}, ${weight}, ${targetWeight}, ${activity}, ${goal}, ${place}, ${trainDays}, ${JSON.stringify(equipment || [])}, ${wakeTime || "07:00"}, ${JSON.stringify(preferences)}::jsonb, now())
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
      wake_time = excluded.wake_time,
      preferences = CASE WHEN ${body.preferences != null} THEN excluded.preferences ELSE profiles.preferences END,
      updated_at = now()
    returning *
  `;

  return NextResponse.json({ profile, targets: calcProfile(profile) });
}
