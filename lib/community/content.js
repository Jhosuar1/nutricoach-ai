import { sql } from "@/lib/db";

const friendAccess = `
    EXISTS (SELECT FROM community_friendships f
      WHERE f.user_a = least($1::uuid, $2::uuid)
      AND f.user_b = greatest($1::uuid, $2::uuid) AND f.accepted)
    AND NOT EXISTS (SELECT FROM community_blocks b WHERE
      (b.blocker = $1 AND b.blocked = $2)
      OR (b.blocker = $2 AND b.blocked = $1))
`;

// A shared visibility predicate keeps the feed, attachments, and reports consistent.
const visiblePost = `
    (p.author = $1 OR (
      EXISTS (SELECT FROM community_friendships f
        WHERE f.user_a = least($1::uuid, p.author)
        AND f.user_b = greatest($1::uuid, p.author) AND f.accepted)
      AND NOT EXISTS (SELECT FROM community_blocks b WHERE
        (b.blocker = $1 AND b.blocked = p.author)
        OR (b.blocker = p.author AND b.blocked = $1))
    ))
`;

export function listPosts(uid) {
  return sql(`
    SELECT p.id, p.author, p.body, p.media_type, p.created_at, a.handle, a.display_name
    FROM community_posts p JOIN community_profiles a ON a.user_id = p.author
    WHERE ${visiblePost}
      AND NOT EXISTS (SELECT FROM community_reports r WHERE r.reporter = $1 AND r.post_id = p.id)
    ORDER BY p.created_at DESC, p.id DESC LIMIT 50
  `, [uid]);
}

export async function createPost(uid, body, mediaType, media) {
  const [, rows] = await sql.transaction([
    sql`SELECT user_id FROM community_profiles WHERE user_id = ${uid} FOR UPDATE`,
    sql`
      INSERT INTO community_posts (author, body, media_type, media)
      SELECT user_id, ${body}, ${mediaType}, decode(${media}, 'base64') FROM community_profiles
      WHERE user_id = ${uid}
      AND (SELECT count(*) FROM community_posts WHERE author = ${uid}) < 200
      AND (SELECT coalesce(sum(octet_length(media)), 0) FROM community_posts WHERE author = ${uid})
        + coalesce(octet_length(decode(${media}, 'base64')), 0) <= 24000000
      RETURNING id
    `,
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

export function readMedia(uid, id) {
  return sql(`SELECT p.media_type, encode(p.media, 'base64') AS media FROM community_posts p
    WHERE p.id = $2 AND p.media IS NOT NULL AND ${visiblePost}`, [uid, id]);
}

export function readMessages(uid, other) {
  return sql(`
    SELECT m.id, m.sender, m.body, m.created_at FROM community_messages m
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
