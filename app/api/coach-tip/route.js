import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { generateGeminiJson } from "@/lib/gemini";

export const maxDuration = 25;

export async function POST(req) {
  if (!(await getUserId())) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const { hora, diaSemana, fecha, consumido, objetivo, goal } = payload;

  if (!consumido || !objetivo) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

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

  const result = await generateGeminiJson(requestBody, { coach: true });
  return NextResponse.json({ tip: typeof result.data?.tip === "string" ? result.data.tip : "" });
}
