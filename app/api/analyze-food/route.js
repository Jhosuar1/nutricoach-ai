import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { generateGeminiJson, isScanImage } from "@/lib/gemini";

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

const metrics = ["peso_g", "calorias", "proteina_g", "carbohidratos_g", "grasa_g", "fibra_g", "azucares_g", "sodio_mg"];
const confidence = ["alta", "media", "baja"];
const schema = {
  type: "OBJECT",
  properties: {
    alimentos: { type: "ARRAY", items: {
      type: "OBJECT",
      properties: {
        nombre: { type: "STRING" }, porcion: { type: "STRING" },
        ...Object.fromEntries(metrics.map(metric => [metric, { type: "NUMBER" }])),
      },
      required: ["nombre", "porcion", ...metrics],
    } },
    confianza: { type: "STRING", enum: confidence },
    nota: { type: "STRING" },
  },
  required: ["alimentos", "confianza", "nota"],
};

function validFoodAnalysis(result) {
  return Array.isArray(result?.alimentos) && result.alimentos.length <= 30 &&
    confidence.includes(result.confianza) && typeof result.nota === "string" &&
    result.alimentos.every(item => item && typeof item.nombre === "string" && typeof item.porcion === "string" &&
      metrics.every(metric => Number.isFinite(item[metric]) && item[metric] >= 0 && item[metric] <= 100000));
}

export const maxDuration = 45;

export async function POST(req) {
  if (!(await getUserId())) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const { base64, mediaType, notaManual } = payload;
  if (!isScanImage(base64, mediaType)) {
    return NextResponse.json({ error: "Envía una imagen válida de tamaño compatible" }, { status: 400 });
  }

  const note = typeof notaManual === "string" ? notaManual.trim().slice(0, 500) : "";
  const promptText = note
    ? `Identifica los alimentos de esta foto y estima su información nutricional total. Además, el usuario indica que en la foto también hay (o no se ve bien): "${note}". Inclúyelo en el análisis.`
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
    generationConfig: { responseMimeType: "application/json", responseSchema: schema },
  };

  const result = await generateGeminiJson(requestBody, { validate: validFoodAnalysis });
  if (Array.isArray(result.data?.alimentos)) return NextResponse.json(result.data);

  return NextResponse.json(
    { error: result.error || "La IA devolvió un análisis incompleto." },
    { status: result.status || 502 }
  );
}
