export async function generateGeminiJson(requestBody, { coach = false } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { status: 503, error: "El servicio de IA aún no está configurado." };

  const models = coach
    ? [process.env.GEMINI_COACH_MODEL || "gemini-flash-lite-latest", "gemini-flash-latest"]
    : [process.env.GEMINI_MODEL || "gemini-flash-latest", process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest"];
  let failure = { status: 502, error: "La IA no pudo completar el análisis." };

  for (const model of new Set(models)) {
    if (!/^[a-zA-Z0-9._-]+$/.test(model)) continue;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(coach ? 10000 : 18000),
        }
      );
      if (response.status === 401 || response.status === 403) {
        return { status: 503, error: "El servicio de IA no tiene acceso al modelo configurado." };
      }
      if (!response.ok) {
        console.warn("Gemini rechazó la solicitud", model, response.status);
        if (response.status === 429) failure = { status: 429, error: "La IA alcanzó su límite temporal. Intenta más tarde." };
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts
        ?.filter((part) => !part.thought && typeof part.text === "string")
        .map((part) => part.text).join("");
      if (text) return { data: JSON.parse(text) };
    } catch (error) {
      console.warn("Falló la solicitud a Gemini", model, error.name);
      if (error.name === "TimeoutError") failure = { status: 504, error: "La IA tardó demasiado. Intenta de nuevo." };
    }
  }

  return failure;
}

export function isScanImage(base64, mediaType) {
  return typeof base64 === "string" &&
    base64.length > 0 && base64.length <= 2_800_000 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(base64) &&
    ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(mediaType);
}
