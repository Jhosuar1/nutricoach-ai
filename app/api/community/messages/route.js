import { readMessages, sendMessage } from "@/lib/community/content";
import { clean, communityRoute, error, json, uuid } from "@/lib/community/http";

export const GET = communityRoute(async (request, uid) => {
  const other = new URL(request.url).searchParams.get("with");
  if (!uuid(other) || other.toLowerCase() === uid) return error("Conversación inválida.");
  return json({ messages: (await readMessages(uid, other)).reverse() });
});

export const POST = communityRoute(async (request, uid) => {
  const input = (await request.json()) || {};
  const body = clean(input.body);
  if (!uuid(input.other) || input.other.toLowerCase() === uid || !body || body.length > 1000) {
    return error("Escribe un mensaje de hasta 1000 caracteres.");
  }
  const [message] = await sendMessage(uid, input.other, body);
  return message ? json({ message }, { status: 201 }) : error("Solo puedes escribir a amistades activas.", 403);
});
