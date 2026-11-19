import { generateGeminiJson } from "../lib/gemini.js";

if (process.env.VERCEL_ENV === "production") {
  const prompt = { text: 'Responde solamente {"ok":true}.' };
  const image = { inline_data: { mime_type: "image/png", data: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAAS0lEQVR4nO3OMQHAIADAMMDYVCIKV/v39GRHoiDz2Wf8ybod+BIqQkWoCBWhIlSEilARKkJFqAgVoSJUhIpQESpCRagIFaEiVITKCw+7Af3w9AfWAAAAAElFTkSuQmCC" } };
  const check = async (kind, parts, coach) => {
    const result = await generateGeminiJson({
      contents: [{ parts }],
      generationConfig: { responseMimeType: "application/json",
        responseSchema: { type: "OBJECT", properties: { ok: { type: "BOOLEAN" } }, required: ["ok"] } },
    }, { coach, validate: data => data?.ok === true });
    console.log(result.data ? `Gemini ${kind}: conexión confirmada (${result.model}).` :
      `Gemini ${kind}: conexión pendiente (HTTP ${result.status}). ${result.error}`);
  };
  await Promise.all([check("texto", [prompt], true), check("imagen", [image, prompt], false)]);
}
