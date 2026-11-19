import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";

export const friendAccess = `
    EXISTS (SELECT FROM community_friendships f
      WHERE f.user_a = least($1::uuid, $2::uuid)
      AND f.user_b = greatest($1::uuid, $2::uuid) AND f.accepted)
    AND NOT EXISTS (SELECT FROM community_blocks b WHERE
      (b.blocker = $1 AND b.blocked = $2)
      OR (b.blocker = $2 AND b.blocked = $1))
`;

// A shared visibility predicate keeps the feed, attachments, and reports consistent.
export const visiblePost = `
    (p.author = $1 OR (
      EXISTS (SELECT FROM community_friendships f
        WHERE f.user_a = least($1::uuid, p.author)
        AND f.user_b = greatest($1::uuid, p.author) AND f.accepted)
      AND NOT EXISTS (SELECT FROM community_blocks b WHERE
        (b.blocker = $1 AND b.blocked = p.author)
        OR (b.blocker = p.author AND b.blocked = $1))
    ))
`;

export function listPosts(uid, scope = "all", query = "", before = null, id = null) {
  return sql(`
    WITH feed AS (
    SELECT p.id, p.author, p.body, p.media_type, p.created_at, a.handle, a.display_name,
      (SELECT count(*)::int FROM community_post_photos photo WHERE photo.post_id = p.id) AS extra_photos,
      (SELECT count(*)::int FROM community_reactions r WHERE r.post_id = p.id AND r.kind = 'like') AS likes,
      (SELECT count(*)::int FROM community_comments c WHERE c.post_id = p.id
        AND NOT EXISTS (SELECT FROM community_blocks b WHERE
          (b.blocker = $1 AND b.blocked = c.author) OR (b.blocker = c.author AND b.blocked = $1))) AS comments,
      EXISTS (SELECT FROM community_reactions r WHERE r.post_id = p.id AND r.user_id = $1 AND r.kind = 'like') AS liked,
      EXISTS (SELECT FROM community_reactions r WHERE r.post_id = p.id AND r.user_id = $1 AND r.kind = 'save') AS saved,
      EXISTS (SELECT FROM community_reposts r WHERE r.post_id = p.id AND r.user_id = $1) AS reposted,
      repost.display_name AS reposted_by, greatest(p.created_at, repost.created_at) AS activity_at
    FROM community_posts p JOIN community_profiles a ON a.user_id = p.author
    LEFT JOIN LATERAL (
      SELECT a2.display_name, r.created_at FROM community_reposts r JOIN community_profiles a2 ON a2.user_id = r.user_id
      JOIN community_friendships f ON f.user_a = least($1::uuid, r.user_id) AND f.user_b = greatest($1::uuid, r.user_id) AND f.accepted
      WHERE r.post_id = p.id AND NOT EXISTS (SELECT FROM community_blocks b
        WHERE (b.blocker = $1 AND b.blocked = r.user_id) OR (b.blocker = r.user_id AND b.blocked = $1))
      ORDER BY r.created_at DESC LIMIT 1
    ) repost ON true
    WHERE ${visiblePost} AND ($5::uuid IS NULL OR p.id = $5)
      AND NOT EXISTS (SELECT FROM community_reports r WHERE r.reporter = $1 AND r.post_id = p.id)
      AND ($2 = 'all' OR ($2 = 'video' AND p.media_type = 'video/mp4')
        OR ($2 = 'mine' AND p.author = $1)
        OR ($2 = 'mine-video' AND p.author = $1 AND p.media_type = 'video/mp4')
        OR ($2 = 'reposts' AND EXISTS (SELECT FROM community_reposts r WHERE r.post_id = p.id AND r.user_id = $1))
        OR ($2 = 'saved' AND EXISTS (SELECT FROM community_reactions r WHERE r.post_id = p.id AND r.user_id = $1 AND r.kind = 'save')))
      AND ($3 = '' OR strpos(lower(p.body), lower($3)) > 0 OR strpos(a.handle, lower($3)) > 0
        OR strpos(lower(a.display_name), lower($3)) > 0)
    )
    SELECT * FROM feed
    WHERE $4::uuid IS NULL OR (activity_at, id) < (
      SELECT previous.activity_at, previous.id FROM feed previous WHERE previous.id = $4
    )
    ORDER BY activity_at DESC, id DESC LIMIT 21
  `, [uid, scope, query, before, id]);
}

export async function createPost(uid, body, files) {
  const id = randomUUID();
  const [first, ...photos] = files;
  const [, rows] = await sql.transaction([
    sql`SELECT user_id FROM community_profiles WHERE user_id = ${uid} FOR UPDATE`,
    sql`
      INSERT INTO community_posts (id, author, body, media_type, media)
      SELECT ${id}, user_id, ${body}, ${first?.type ?? null}, decode(${first?.media ?? null}, 'base64') FROM community_profiles
      WHERE user_id = ${uid}
      AND (SELECT count(*) FROM community_posts WHERE author = ${uid}) < 200
      AND (SELECT coalesce(sum(octet_length(media)), 0) FROM community_posts WHERE author = ${uid})
        + (SELECT coalesce(sum(octet_length(photo.media)), 0)
          FROM community_post_photos photo JOIN community_posts post ON post.id = photo.post_id WHERE post.author = ${uid})
        + ${files.reduce((total, file) => total + file.size, 0)} <= 24000000
      RETURNING id
    `,
    ...photos.map((photo, index) => sql`
      INSERT INTO community_post_photos (post_id, position, media_type, media)
      SELECT id, ${index + 1}, ${photo.type}, decode(${photo.media}, 'base64')
      FROM community_posts WHERE id = ${id}
    `),
  ]);
  return rows[0];
}

export function deletePost(uid, id) {
  return sql`DELETE FROM community_posts WHERE id = ${id} AND author = ${uid} RETURNING id`;
}

export function reportPost(uid, id) {
  return sql(`
    INSERT INTO community_reports (reporter, post_id)
    SELECT $1, p.id FROM community_posts p WHERE p.id = $2 AND p.author <> $1
      AND ${visiblePost} ON CONFLICT DO NOTHING
  `, [uid, id]);
}

export function readMedia(uid, id, position) {
  if (position === 0) return sql(`SELECT p.media_type, encode(p.media, 'base64') AS media FROM community_posts p
    WHERE p.id = $2 AND p.media IS NOT NULL AND ${visiblePost}`, [uid, id]);
  return sql(`SELECT photo.media_type, encode(photo.media, 'base64') AS media FROM community_posts p
    JOIN community_post_photos photo ON photo.post_id = p.id
    WHERE p.id = $2 AND photo.position = $3 AND ${visiblePost}`, [uid, id, position]);
}

export function readMessages(uid, other) {
  return sql(`
    SELECT m.id, m.sender, m.body, m.created_at, attachment.filename, attachment.mime
    FROM community_messages m LEFT JOIN community_chat_files attachment ON attachment.message_id = m.id
    WHERE ((m.sender = $1 AND m.recipient = $2)
       OR (m.sender = $2 AND m.recipient = $1))
      AND ${friendAccess}
    ORDER BY m.created_at DESC, m.id DESC LIMIT 100
  `, [uid, other]);
}

export function sendMessage(uid, other, body) {
  return sql(`
    INSERT INTO community_messages (sender, recipient, body)
    SELECT $1, $2, $3 WHERE ${friendAccess}
    RETURNING id, sender, body, created_at
  `, [uid, other, body]);
}
