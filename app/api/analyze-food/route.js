import { NextResponse } from "next/server";

const SYSTEM_PROMPT =
  'Eres un analista nutricional experto. Analiza la imagen de comida y responde ' +
  'EXCLUSIVAMENTE con un objeto JSON valido, sin texto adicional, sin markdown ni backticks. ' +
  'Formato exacto: {"alimentos":[{"nombre":string,"porcion":string,"peso_g":number,' +
  '"calorias":number,"proteina_g":number,"carbohidratos_g":number,"grasa_g":number,' +
  '"fibra_g":number,"azucares_g":number,"sodio_mg":number}],"confianza":"alta|media|baja",' +
  '"nota":string}. Se realista con las estimaciones segun el tamano aparente de la porcion. ' +
  'Si el usuario menciona alimentos adicionales que no se ven bien en la foto, incluyelos ' +
  'tambien en la lista de "alimentos" con tu mejor estimacion. ' +
  'Si algo no es claro, explicalo brevemente en "nota" y baja la confianza.';

// Se prueba primero el modelo principal; si tarda demasiado o falla, se reintenta
// automáticamente con un modelo de respaldo antes de darse por vencido.
const MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];
const TIMEOUT_MS = 18000;

async function callGemini(model, requestBody) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }
    );
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Falta configurar GEMINI_API_KEY en el servidor" }, { status: 500 });
  }

  const { base64, mediaType, notaManual } = await req.json();
  if (!base64) {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  }

  const promptText = notaManual?.trim()
    ? `Identifica los alimentos de esta foto y estima su información nutricional total. Además, el usuario indica que en la foto también hay (o no se ve bien): "${notaManual.trim()}". Inclúyelo en el análisis.`
    : "Identifica los alimentos de esta foto y estima su información nutricional total.";

  const requestBody = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mediaType, data: base64 } },
          { text: promptText },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  };

  let lastError = "desconocido";

  for (const model of MODELS) {
    try {
      const res = await callGemini(model, requestBody);

      if (!res.ok) {
        lastError = await res.text().catch(() => res.statusText);
        console.error(`Gemini (${model}) error:`, lastError);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = "respuesta vacía";
        continue;
      }

      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (e) {
      lastError = e.name === "AbortError" ? "tiempo de espera agotado" : String(e);
      console.error(`Gemini (${model}) excepción:`, lastError);
      continue; // intenta con el siguiente modelo de la lista
    }
  }

  return NextResponse.json(
    { error: "La IA no respondió a tiempo. Intenta de nuevo, o agrega la comida manualmente." },
    { status: 504 }
  );
}
