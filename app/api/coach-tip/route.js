import { NextResponse } from "next/server";

const MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"];
const TIMEOUT_MS = 12000;

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
    return NextResponse.json({ tip: "" });
  }

  const { hora, diaSemana, fecha, consumido, objetivo, goal } = await req.json();

  const prompt =
    `Son las ${hora} del ${diaSemana} ${fecha}. El objetivo del usuario es "${goal}". ` +
    `Hoy lleva consumidas ${Math.round(consumido.calories)} de ${objetivo.calories} kcal, ` +
    `${Math.round(consumido.protein)}g de ${objetivo.protein}g de proteína, y ` +
    `${consumido.water}ml de ${objetivo.water}ml de agua. ` +
    `Dale UNA recomendación breve (máximo 2 frases, en español, tono cercano y motivador) sobre ` +
    `qué le conviene hacer AHORA MISMO según la hora del día: si le conviene comer algo (y qué tipo, ` +
    `ej. snack proteico, fruta, etc.), si mejor debería tomar agua en vez de picar algo, o si ya va bien ` +
    `y no necesita nada por ahora. Considera que el hambre entre comidas muchas veces es sed. ` +
    `Responde EXCLUSIVAMENTE con JSON: {"tip": string}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  };

  for (const model of MODELS) {
    try {
      const res = await callGemini(model, requestBody);
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      const parsed = JSON.parse(text);
      return NextResponse.json({ tip: parsed.tip || "" });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ tip: "" });
}
