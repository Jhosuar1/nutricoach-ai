import { detectChatFile, sendAttachment } from "@/lib/community/chat-files";
import { readMessages, sendMessage } from "@/lib/community/content";
import { clean, communityRoute, error, json, uuid } from "@/lib/community/http";

export const GET = communityRoute(async (request, uid) => {
  const other = new URL(request.url).searchParams.get("with");
  if (!uuid(other) || other.toLowerCase() === uid) return error("Conversación inválida.");
  return json({ messages: (await readMessages(uid, other)).reverse() });
});

export const POST = communityRoute(async (request, uid) => {
  const multipart = request.headers.get("content-type")?.startsWith("multipart/form-data");
  const form = multipart ? await request.formData().catch(() => null) : null;
  const input = multipart ? { other: form?.get("other"), body: form?.get("body") } : (await request.json()) || {};
  const body = clean(input.body);
  if (!uuid(input.other) || input.other.toLowerCase() === uid || body.length > 1000) {
    return error("Escribe hasta 1000 caracteres y elige una conversación válida.");
  }
  const file = form?.get("file");
  if (multipart) {
    if (!(file instanceof File) || !file.size || file.size > 3000000) return error("Adjunta un archivo de hasta 3 MB.", 413);
    const bytes = Buffer.from(await file.arrayBuffer());
    const mime = detectChatFile(bytes, file);
    if (!mime) return error("Adjunta una foto, video, nota de voz, PDF o ZIP compatible.");
    const filename = Array.from(file.name.replace(/[\u0000-\u001f\u007f/\\]/g, "_")).slice(0, 120).join("") || "archivo";
    const message = await sendAttachment(uid, input.other, body, filename, mime, bytes);
    return message ? json({ message }, { status: 201 }) : error("Solo puedes adjuntar a amistades activas, con hasta 30 MB de archivos enviados.", 403);
  }
  if (!body) return error("Escribe un mensaje.");
  const [message] = await sendMessage(uid, input.other, body);
  return message ? json({ message }, { status: 201 }) : error("Solo puedes escribir a amistades activas.", 403);
});
