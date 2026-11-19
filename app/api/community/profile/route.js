import { sql } from "@/lib/db";
import { clean, communityRoute, error, json } from "@/lib/community/http";

export const GET = communityRoute(async (request, uid) => {
  const [profile] = await sql`
    SELECT user_id, handle, display_name, bio FROM community_profiles WHERE user_id = ${uid}
  `;
  if (profile && new URL(request.url).searchParams.has("summary")) {
    const [stats] = await sql`
      SELECT (SELECT count(*)::int FROM community_posts WHERE author = ${uid}) AS posts,
        (SELECT count(*)::int FROM community_friendships f WHERE f.accepted
          AND ${uid} IN (f.user_a, f.user_b)
          AND NOT EXISTS (SELECT FROM community_blocks b WHERE
            (b.blocker = f.user_a AND b.blocked = f.user_b) OR (b.blocker = f.user_b AND b.blocked = f.user_a))) AS friends,
        (SELECT count(*)::int FROM community_reposts r
          JOIN community_posts p ON p.id = r.post_id
          JOIN community_friendships f ON f.user_a = least(r.user_id, p.author)
            AND f.user_b = greatest(r.user_id, p.author) AND f.accepted
          WHERE r.user_id = ${uid} AND NOT EXISTS (SELECT FROM community_blocks b WHERE
            (b.blocker = r.user_id AND b.blocked = p.author) OR (b.blocker = p.author AND b.blocked = r.user_id))
            AND NOT EXISTS (SELECT FROM community_reports report WHERE report.post_id = p.id AND report.reporter = r.user_id)) AS reposts
    `;
    return json({ profile, stats });
  }
  return json({ profile: profile || null });
});

export const PUT = communityRoute(async (request, uid) => {
  const body = await request.json();
  const handle = clean(body?.handle).toLowerCase();
  const name = clean(body?.name);
  const bio = clean(body?.bio);
  if (!/^[a-z0-9_]{3,24}$/.test(handle) || !name || name.length > 50 || bio.length > 240) {
    return error("Usa un nombre y un usuario de 3 a 24 caracteres. El usuario admite letras, números y guion bajo.");
  }
  try {
    const [profile] = await sql`
      INSERT INTO community_profiles (user_id, handle, display_name, bio) VALUES (${uid}, ${handle}, ${name}, ${bio})
      ON CONFLICT (user_id) DO UPDATE SET handle = excluded.handle, display_name = excluded.display_name, bio = excluded.bio
      RETURNING user_id, handle, display_name, bio
    `;
    return json({ profile });
  } catch (failure) {
    if (failure.code === "23505") return error("Ese nombre de usuario ya está en uso.", 409);
    throw failure;
  }
});
