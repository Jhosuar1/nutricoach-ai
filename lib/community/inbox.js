import { sql } from "@/lib/db";

export function listConversations(uid) {
  return sql`
    SELECT a.user_id, a.handle, a.display_name, last.body AS last_body, last.created_at AS last_at,
      last.sender AS last_sender, coalesce(unread.total, 0) AS unread
    FROM community_friendships f
    JOIN community_profiles a ON a.user_id = CASE WHEN f.user_a = ${uid} THEN f.user_b ELSE f.user_a END
    LEFT JOIN community_message_reads r ON r.reader = ${uid} AND r.peer = a.user_id
    LEFT JOIN LATERAL (
      SELECT m.body, m.sender, m.created_at FROM community_messages m
      WHERE (m.sender = ${uid} AND m.recipient = a.user_id) OR (m.sender = a.user_id AND m.recipient = ${uid})
      ORDER BY m.created_at DESC, m.id DESC LIMIT 1
    ) last ON true
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS total FROM community_messages m
      WHERE m.sender = a.user_id AND m.recipient = ${uid} AND m.created_at > coalesce(r.read_at, '-infinity')
    ) unread ON true
    WHERE (f.user_a = ${uid} OR f.user_b = ${uid}) AND f.accepted
      AND NOT EXISTS (SELECT FROM community_blocks b WHERE
        (b.blocker = ${uid} AND b.blocked = a.user_id) OR (b.blocker = a.user_id AND b.blocked = ${uid}))
    ORDER BY last.created_at DESC NULLS LAST, a.handle LIMIT 100
  `;
}

export function markRead(uid, peer, message) {
  return sql`
    INSERT INTO community_message_reads (reader, peer, read_at)
    SELECT recipient, sender, created_at FROM community_messages
    WHERE id = ${message} AND recipient = ${uid} AND sender = ${peer}
    ON CONFLICT (reader, peer) DO UPDATE
    SET read_at = greatest(community_message_reads.read_at, excluded.read_at)
  `;
}
