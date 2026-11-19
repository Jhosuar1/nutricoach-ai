import { sql } from "@/lib/db";
import { changeFriendship, listPeople } from "@/lib/community/people";
import { communityRoute, clean, error, json, uuid } from "@/lib/community/http";

export const GET = communityRoute(async (request, uid) => {
  const query = clean(new URL(request.url).searchParams.get("q")).replace(/^@/, "").toLowerCase();
  if (query.length > 50) return error("Busca por nombre o usuario.");
  const [people, blocked] = await Promise.all([
    listPeople(uid, query),
    query ? [] : sql`SELECT p.user_id, p.handle, p.display_name FROM community_blocks b
      JOIN community_profiles p ON p.user_id = b.blocked WHERE b.blocker = ${uid} ORDER BY p.handle LIMIT 50`,
  ]);
  return json({ people, blocked });
});

export const POST = communityRoute(async (request, uid) => {
  const { other, action } = (await request.json()) || {};
  if (!uuid(other) || other.toLowerCase() === uid || !["request", "accept", "remove", "block", "unblock"].includes(action)) {
    return error("Acción inválida.");
  }
  if (!await changeFriendship(uid, other, action)) return error("La solicitud ya cambió o el perfil no está disponible.", 409);
  return json({ ok: true });
});
