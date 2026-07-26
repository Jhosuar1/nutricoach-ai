import { NextResponse } from "next/server";

const SYSTEM_PROMPT =
  'Eres un asistente que da una ESTIMACION VISUAL APROXIMADA de estatura y peso a partir ' +
  'de una foto de cuerpo completo de una persona. Esto NO es una medicion medica precisa, ' +
  'es solo una referencia orientativa. Responde EXCLUSIVAMENTE con JSON valido, sin markdown: ' +
  '{"altura_cm_estimada":number,"peso_kg_estimado":number,"confianza":"alta|media|baja",' +
  '"nota":string}. En "nota" siempre recuerda amablemente que es una aproximacion visual y ' +
  'que para mayor precision conviene usar una bascula y una cinta metrica reales. ' +
  'Se respetuoso y neutral, nunca hagas comentarios sobre la apariencia corporal mas alla ' +
  'de la estimacion solicitada.';

const MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];
const TIMEOUT_MS = 18000;

async function callGemini(model, requestBody) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Falta configurar GEMINI_API_KEY en el servidor" }, { status: 500 });
  }

  const { base64, mediaType } = await req.json();
  if (!base64) {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
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

  for (const model of MODELS) {
    try {
      const res = await callGemini(model, requestBody);
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      return NextResponse.json(JSON.parse(text));
    } catch {
      continue;
    }
  }

  return NextResponse.json(
    { error: "No se pudo analizar la foto. Intenta con otra foto de cuerpo completo, de frente y con buena luz." },
    { status: 504 }
  );
}
