import { sql } from "@/lib/db";

export async function listPeople(uid, query) {
  return sql`
    SELECT p.user_id, p.handle, p.display_name, p.bio, f.requester,
      CASE WHEN f.accepted THEN 'friend' WHEN f.requester = ${uid} THEN 'sent'
           WHEN f.requester IS NOT NULL THEN 'received' ELSE 'none' END AS relationship
    FROM community_profiles p
    LEFT JOIN community_friendships f ON f.user_a = least(p.user_id, ${uid}::uuid)
      AND f.user_b = greatest(p.user_id, ${uid}::uuid)
    WHERE p.user_id <> ${uid}
      AND NOT EXISTS (SELECT FROM community_blocks b WHERE
        (b.blocker = ${uid} AND b.blocked = p.user_id) OR (b.blocker = p.user_id AND b.blocked = ${uid}))
      AND (CASE WHEN ${query} = '' THEN f.requester IS NOT NULL ELSE starts_with(p.handle, ${query}) END)
    ORDER BY f.accepted DESC NULLS LAST, p.handle LIMIT 50
  `;
}

export async function changeFriendship(uid, other, action) {
  const [profile] = await sql`SELECT user_id FROM community_profiles WHERE user_id = ${uid}`;
  if (!profile) return false;

  if (action === "request") {
    const [row] = await sql`
      INSERT INTO community_friendships (user_a, user_b, requester)
      SELECT least(${uid}::uuid, ${other}::uuid), greatest(${uid}::uuid, ${other}::uuid), ${uid}
      FROM community_profiles p WHERE p.user_id = ${other}
      AND NOT EXISTS (SELECT FROM community_blocks WHERE
        (blocker = ${uid} AND blocked = ${other}) OR (blocker = ${other} AND blocked = ${uid}))
      ON CONFLICT DO NOTHING RETURNING requester
    `;
    return !!row;
  }
  if (action === "accept") {
    const [row] = await sql`
      UPDATE community_friendships SET accepted = true WHERE
      user_a = least(${uid}::uuid, ${other}::uuid) AND user_b = greatest(${uid}::uuid, ${other}::uuid)
      AND requester = ${other} AND NOT accepted
      AND NOT EXISTS (SELECT FROM community_blocks WHERE
        (blocker = ${uid} AND blocked = ${other}) OR (blocker = ${other} AND blocked = ${uid}))
      RETURNING requester
    `;
    return !!row;
  }

  if (action === "block") {
    await sql.transaction([
      sql`INSERT INTO community_blocks (blocker, blocked)
        SELECT ${uid}, user_id FROM community_profiles WHERE user_id = ${other} ON CONFLICT DO NOTHING`,
      sql`DELETE FROM community_friendships WHERE
        user_a = least(${uid}::uuid, ${other}::uuid) AND user_b = greatest(${uid}::uuid, ${other}::uuid)`,
    ]);
    return true;
  }
  if (action === "unblock") {
    await sql`DELETE FROM community_blocks WHERE blocker = ${uid} AND blocked = ${other}`;
    return true;
  }
  await sql`DELETE FROM community_friendships WHERE
    user_a = least(${uid}::uuid, ${other}::uuid) AND user_b = greatest(${uid}::uuid, ${other}::uuid)`;
  return true;
}
