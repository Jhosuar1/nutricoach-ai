import { sql } from "@/lib/db";

export function listActivity(uid) {
  return sql`
    WITH events AS (
      SELECT f.requester AS actor, 'friend' AS kind, NULL::uuid AS target, f.requested_at AS occurred_at
      FROM community_friendships f
      WHERE (f.user_a = ${uid} OR f.user_b = ${uid}) AND f.requester <> ${uid} AND NOT f.accepted
      UNION ALL
      SELECT CASE WHEN f.user_a = ${uid} THEN f.user_b ELSE f.user_a END,
        'accepted', NULL::uuid, f.accepted_at
      FROM community_friendships f
      WHERE f.requester = ${uid} AND f.accepted AND f.accepted_at IS NOT NULL
      UNION ALL
      SELECT c.author, 'comment', p.id, c.created_at FROM community_comments c
      JOIN community_posts p ON p.id = c.post_id
      LEFT JOIN community_comments parent ON parent.id = c.parent_id
      WHERE (p.author = ${uid} OR parent.author = ${uid}) AND c.author <> ${uid}
      AND (p.author = ${uid} OR EXISTS (SELECT FROM community_friendships f WHERE f.accepted
        AND f.user_a = least(p.author, ${uid}::uuid) AND f.user_b = greatest(p.author, ${uid}::uuid)))
      AND NOT EXISTS (SELECT FROM community_blocks b WHERE
        (b.blocker = ${uid} AND b.blocked = p.author) OR (b.blocker = p.author AND b.blocked = ${uid}))
      UNION ALL
      SELECT r.user_id, 'like', p.id, r.created_at FROM community_reactions r
      JOIN community_posts p ON p.id = r.post_id
      WHERE p.author = ${uid} AND r.user_id <> ${uid} AND r.kind = 'like'
      UNION ALL
      SELECT r.user_id, 'repost', p.id, r.created_at FROM community_reposts r
      JOIN community_posts p ON p.id = r.post_id
      WHERE p.author = ${uid} AND r.user_id <> ${uid}
      UNION ALL
      SELECT m.sender, 'message', NULL::uuid, latest.occurred_at FROM community_messages m
      JOIN (SELECT sender, max(created_at) AS occurred_at FROM community_messages
        WHERE recipient = ${uid} GROUP BY sender) latest
        ON latest.sender = m.sender AND latest.occurred_at = m.created_at
      WHERE m.recipient = ${uid}
      AND EXISTS (SELECT FROM community_friendships f WHERE f.accepted
        AND f.user_a = least(m.sender, ${uid}::uuid) AND f.user_b = greatest(m.sender, ${uid}::uuid))
    )
    SELECT DISTINCT e.actor AS user_id, a.handle, a.display_name, e.kind, e.target, e.occurred_at, e.occurred_at::text AS read_cursor,
      e.occurred_at > coalesce(read.read_at, '-infinity') AS unread
    FROM events e JOIN community_profiles a ON a.user_id = e.actor
    LEFT JOIN community_activity_reads read ON read.user_id = ${uid}
    WHERE NOT EXISTS (SELECT FROM community_blocks b WHERE
      (b.blocker = ${uid} AND b.blocked = e.actor) OR (b.blocker = e.actor AND b.blocked = ${uid}))
    ORDER BY e.occurred_at DESC LIMIT 30
  `;
}

export function markActivity(uid, at) {
  return sql`INSERT INTO community_activity_reads (user_id, read_at)
    VALUES (${uid}, least(${at}::timestamptz, now()))
    ON CONFLICT (user_id) DO UPDATE SET read_at = greatest(community_activity_reads.read_at, excluded.read_at)`;
}
