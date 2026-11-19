import { sql } from "@/lib/db";
import { visiblePost } from "./content";

const availablePost = `${visiblePost}
  AND NOT EXISTS (SELECT FROM community_reports r WHERE r.reporter = $1 AND r.post_id = p.id)`;

export function readComments(uid, id) {
  return sql(`
    SELECT c.id, c.author, c.body, c.created_at, a.display_name, a.handle
    FROM community_comments c JOIN community_posts p ON p.id = c.post_id
    JOIN community_profiles a ON a.user_id = c.author
    WHERE p.id = $2 AND ${availablePost} AND NOT EXISTS (SELECT FROM community_blocks b WHERE
      (b.blocker = $1 AND b.blocked = c.author) OR (b.blocker = c.author AND b.blocked = $1))
    ORDER BY c.created_at DESC, c.id DESC LIMIT 50
  `, [uid, id]);
}

export function createComment(uid, id, body) {
  return sql(`
    INSERT INTO community_comments (post_id, author, body)
    SELECT p.id, a.user_id, $3 FROM community_posts p CROSS JOIN community_profiles a
    WHERE p.id = $2 AND a.user_id = $1 AND ${availablePost}
    RETURNING id
  `, [uid, id, body]);
}

export function deleteComment(uid, id) {
  return sql`DELETE FROM community_comments WHERE id = ${id} AND author = ${uid}`;
}

export function setReaction(uid, id, kind, enabled) {
  if (!enabled) return sql`
    DELETE FROM community_reactions WHERE post_id = ${id} AND user_id = ${uid} AND kind = ${kind}
  `;
  return sql(`
    WITH target AS (
      SELECT p.id, a.user_id FROM community_posts p CROSS JOIN community_profiles a
      WHERE p.id = $2 AND a.user_id = $1 AND ${availablePost}
    ), write AS (
      INSERT INTO community_reactions (post_id, user_id, kind)
      SELECT id, user_id, $3 FROM target ON CONFLICT DO NOTHING
    )
    SELECT id FROM target
  `, [uid, id, kind]);
}
