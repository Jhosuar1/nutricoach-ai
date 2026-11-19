import { sql } from "@/lib/db";
import { usesProfessionalPlan } from "@/lib/preferences";
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { generateGeminiJson, isScanImage } from "@/lib/gemini";

const SYSTEM_PROMPT =
  'Eres un asistente que da una ESTIMACION VISUAL APROXIMADA de estatura y peso a partir ' +
  'de una foto de cuerpo completo de una persona. Esto NO es una medicion medica precisa, ' +
  'es solo una referencia orientativa. Responde EXCLUSIVAMENTE con JSON valido, sin markdown: ' +
  '{"altura_cm_estimada":number,"peso_kg_estimado":number,"confianza":"alta|media|baja",' +
  '"nota":string}. En "nota" siempre recuerda amablemente que es una aproximacion visual y ' +
  'que para mayor precision conviene usar una bascula y una cinta metrica reales. ' +
  'Se respetuoso y neutral, nunca hagas comentarios sobre la apariencia corporal mas alla ' +
  'de la estimacion solicitada.';

export const maxDuration = 45;

export async function POST(req) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const [profile] = await sql`SELECT age, preferences FROM profiles WHERE user_id = ${uid}`;
  if (!profile || usesProfessionalPlan(profile)) {
    return NextResponse.json({ error: "Las estimaciones corporales están desactivadas para este perfil." }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const { base64, mediaType } = payload;
  if (!isScanImage(base64, mediaType)) {
    return NextResponse.json({ error: "Envía una imagen válida de tamaño compatible" }, { status: 400 });
  }

  const requestBody = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mediaType, data: base64 } },
          { text: "Estima la altura y el peso aproximados de la persona en esta foto de cuerpo completo." },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  };

  const result = await generateGeminiJson(requestBody);
  if (Number.isFinite(result.data?.altura_cm_estimada) && Number.isFinite(result.data?.peso_kg_estimado)) return NextResponse.json(result.data);

  return NextResponse.json(
    { error: result.error || "La IA devolvió un análisis incompleto." },
    { status: result.status || 502 }
  );
}
