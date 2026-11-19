import { createHmac } from "node:crypto";
import { sql } from "@/lib/db";
import { friendAccess } from "./content";

const open = `c.ended_at IS NULL
  AND c.created_at > now() - (CASE WHEN c.answer IS NULL THEN interval '90 seconds' ELSE interval '2 hours' END)`;
const permitted = `
  EXISTS (SELECT FROM community_friendships f WHERE f.accepted
    AND f.user_a = least(c.caller, c.callee) AND f.user_b = greatest(c.caller, c.callee))
  AND NOT EXISTS (SELECT FROM community_blocks b
    WHERE (b.blocker = c.caller AND b.blocked = c.callee) OR (b.blocker = c.callee AND b.blocked = c.caller))
`;

export function iceServers(uid) {
  const servers = [{ urls: "stun:stun.l.google.com:19302" }];
  const urls = process.env.COMMUNITY_TURN_URLS?.split(",").map(url => url.trim()).filter(url => /^turns?:/.test(url));
  const secret = process.env.COMMUNITY_TURN_SECRET;
  if (secret && urls?.length) {
    const username = `${Math.floor(Date.now() / 1000) + 10800}:${uid}`;
    servers.push({ urls, username, credential: createHmac("sha1", secret).update(username).digest("base64") });
  }
  return servers;
}

export function incomingCall(uid) {
  return sql(`SELECT c.id, c.caller, p.display_name, p.handle FROM community_calls c
    JOIN community_profiles p ON p.user_id = c.caller
    WHERE c.callee = $1 AND c.answer IS NULL AND ${open} AND ${permitted}
    ORDER BY c.created_at DESC LIMIT 1`, [uid]);
}

export function readCall(uid, id) {
  return sql(`SELECT c.id, c.caller, c.callee, c.offer, c.answer,
    NOT (${open} AND ${permitted}) AS closed
    FROM community_calls c WHERE c.id = $2 AND $1::uuid IN (c.caller, c.callee)`, [uid, id]);
}

export async function startCall(uid, other, offer) {
  const [, , rows] = await sql.transaction([
    sql`SELECT user_id FROM community_profiles WHERE user_id IN (${uid}, ${other}) ORDER BY user_id FOR UPDATE`,
    sql`DELETE FROM community_calls WHERE caller = ${uid} AND created_at < now() - interval '1 day'`,
    sql(`INSERT INTO community_calls (caller, callee, offer)
      SELECT $1, $2, $3::jsonb WHERE ${friendAccess}
      AND NOT EXISTS (SELECT FROM community_calls c WHERE ${open}
        AND ($1::uuid IN (c.caller, c.callee) OR $2::uuid IN (c.caller, c.callee)))
      RETURNING id`, [uid, other, JSON.stringify(offer)]),
  ]);
  return rows;
}

export function answerCall(uid, id, answer) {
  return sql(`UPDATE community_calls c SET answer = $3::jsonb WHERE c.id = $2 AND c.callee = $1
    AND c.answer IS NULL AND ${open} AND ${permitted} RETURNING c.id`, [uid, id, JSON.stringify(answer)]);
}

export function endCall(uid, id) {
  return sql`UPDATE community_calls SET ended_at = now(), offer = '{}'::jsonb, answer = NULL WHERE id = ${id}
    AND ${uid} IN (caller, callee) AND ended_at IS NULL`;
}
