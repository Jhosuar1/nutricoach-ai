import { listConversations, markRead } from "@/lib/community/inbox";
import { communityRoute, error, json, uuid } from "@/lib/community/http";

export const GET = communityRoute(async (_request, uid) => json({ conversations: await listConversations(uid) }));

export const POST = communityRoute(async (request, uid) => {
  const { peer, message } = (await request.json()) || {};
  if (!uuid(peer) || !uuid(message)) return error("Conversación inválida.");
  await markRead(uid, peer, message);
  return json({ ok: true });
});
