import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { sql } from "@/lib/db";
import { generateGeminiJson } from "@/lib/gemini";
import { GOALS } from "@/lib/nutrition";
import { TRAINING_LEVELS, trainingPreferences, usesProfessionalPlan } from "@/lib/preferences";

export const maxDuration = 25;

export async function POST(req) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const payload = await req.json().catch(() => null);
  const hour = payload?.hour;
  const meals = payload?.meals;
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(meals) || meals < 0 || meals > 200) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const [profile] = await sql`SELECT age, goal, preferences FROM profiles WHERE user_id = ${uid}`;
  if (!profile || usesProfessionalPlan(profile)) {
    return NextResponse.json({ error: "El consejo automático está desactivado para este perfil." }, { status: 403 });
  }
  const prefs = trainingPreferences(profile.preferences);
  const context = { hour, meals, goal: GOALS[profile.goal]?.label ?? GOALS.mantener.label,
    experience: TRAINING_LEVELS[prefs.level], trainingMinutes: prefs.minutes };
  const result = await generateGeminiJson({
    systemInstruction: { parts: [{ text: "Escribe un solo consejo práctico, de máximo dos frases en español, basado en el contexto. Sugiere hábitos generales como planificar una comida o registrar el entrenamiento. No inventes síntomas, enfermedades, restricciones ni diagnósticos. No indiques calorías, gramos, suplementos, ayunos, intensidad, cantidades de líquido ni tratamientos. No sugieras evitar comer si hay hambre." }] },
    contents: [{ parts: [{ text: JSON.stringify(context) }] }],
    generationConfig: { responseMimeType: "application/json",
      responseSchema: { type: "OBJECT", properties: { tip: { type: "STRING" } }, required: ["tip"] } },
  }, { coach: true, validate: data => typeof data?.tip === "string" && data.tip.trim().length > 0 && data.tip.length <= 420 });
  if (!result.data) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ tip: result.data.tip });
}
