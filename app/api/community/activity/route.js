import { listActivity, markActivity } from "@/lib/community/activity";
import { communityRoute, error, json } from "@/lib/community/http";

export const GET = communityRoute(async (_request, uid) => json({ events: await listActivity(uid) }));

export const POST = communityRoute(async (request, uid) => {
  const { at } = (await request.json()) || {};
  if (typeof at !== "string" || !Number.isFinite(Date.parse(at))) return error("Fecha inválida.");
  await markActivity(uid, at);
  return json({ ok: true });
});
