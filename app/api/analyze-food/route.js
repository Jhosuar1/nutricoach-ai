import { NextResponse } from "next/server";

const SYSTEM_PROMPT =
  'Eres un analista nutricional experto. Analiza la imagen de comida y responde ' +
  'EXCLUSIVAMENTE con un objeto JSON valido, sin texto adicional, sin markdown ni backticks. ' +
  'Formato exacto: {"alimentos":[{"nombre":string,"porcion":string,"peso_g":number,' +
  '"calorias":number,"proteina_g":number,"carbohidratos_g":number,"grasa_g":number,' +
  '"fibra_g":number,"azucares_g":number,"sodio_mg":number}],"confianza":"alta|media|baja",' +
  '"nota":string}. Se realista con las estimaciones segun el tamano aparente de la porcion. ' +
  'Si algo no es claro, explicalo brevemente en "nota" y baja la confianza.';

export async function POST(req) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Falta configurar GEMINI_API_KEY en el servidor" },
      { status: 500 }
    );
  }

  const { base64, mediaType } = await req.json();
  if (!base64) {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  }

  try {
    // Gemini 2.5 Flash: nivel gratuito de Google AI Studio, sin tarjeta de crédito.
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mediaType, data: base64 } },
                { text: "Identifica los alimentos de esta foto y estima su información nutricional total." },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", errText);
      if (res.status === 429) {
        return NextResponse.json(
          { error: "Se alcanzó el límite gratuito de solicitudes por ahora, intenta en un minuto" },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "El servicio de IA no respondió correctamente" }, { status: 502 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: "Respuesta vacía del modelo" }, { status: 502 });
    }

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se pudo analizar la imagen" }, { status: 500 });
  }
}
