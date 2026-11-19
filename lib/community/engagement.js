import { sql } from "@/lib/db";
import { visiblePost } from "./content";

const availablePost = `${visiblePost}
  AND NOT EXISTS (SELECT FROM community_reports r WHERE r.reporter = $1 AND r.post_id = p.id)`;

export function readComments(uid, id) {
  return sql(`
    SELECT c.id, c.author, c.body, c.created_at, c.parent_id, a.display_name, a.handle
    FROM community_comments c JOIN community_posts p ON p.id = c.post_id
    JOIN community_profiles a ON a.user_id = c.author
    WHERE p.id = $2 AND ${availablePost} AND NOT EXISTS (SELECT FROM community_blocks b WHERE
      (b.blocker = $1 AND b.blocked = c.author) OR (b.blocker = c.author AND b.blocked = $1))
    ORDER BY c.created_at DESC, c.id DESC LIMIT 50
  `, [uid, id]);
}

export function createComment(uid, id, body, parent = null) {
  return sql(`
    INSERT INTO community_comments (post_id, author, body, parent_id)
    SELECT p.id, a.user_id, $3, $4 FROM community_posts p CROSS JOIN community_profiles a
    WHERE p.id = $2 AND a.user_id = $1 AND ${availablePost}
      AND ($4::uuid IS NULL OR EXISTS (SELECT FROM community_comments parent
        WHERE parent.id = $4 AND parent.post_id = p.id AND parent.parent_id IS NULL
        AND NOT EXISTS (SELECT FROM community_blocks b WHERE
          (b.blocker = $1 AND b.blocked = parent.author) OR (b.blocker = parent.author AND b.blocked = $1))))
    RETURNING id
  `, [uid, id, body, parent]);
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

export function setRepost(uid, id, enabled) {
  if (!enabled) return sql`DELETE FROM community_reposts WHERE user_id = ${uid} AND post_id = ${id}`;
  return sql(`
    WITH target AS (
      SELECT p.id, a.user_id FROM community_posts p CROSS JOIN community_profiles a
      WHERE p.id = $2 AND a.user_id = $1 AND p.author <> $1 AND ${availablePost}
    ), write AS (
      INSERT INTO community_reposts (post_id, user_id)
      SELECT id, user_id FROM target ON CONFLICT DO NOTHING
    )
    SELECT id FROM target
  `, [uid, id]);
}
