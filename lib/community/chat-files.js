import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import { friendAccess } from "./content";

export function detectChatFile(bytes, file) {
  const start = bytes.toString("ascii", 0, 12);
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (start.startsWith("RIFF") && start.endsWith("WEBP")) return "image/webp";
  if (start.startsWith("%PDF-")) return "application/pdf";
  if (["504b0304", "504b0506", "504b0708"].includes(bytes.subarray(0, 4).toString("hex"))) return "application/zip";
  if (start.slice(4, 8) === "ftyp") return file.type.startsWith("audio/") || /\.m4a$/i.test(file.name) ? "audio/mp4" : "video/mp4";
  if (bytes.subarray(0, 4).toString("hex") === "1a45dfa3") return file.type.startsWith("audio/") || /voz.*\.webm$/i.test(file.name) ? "audio/webm" : "video/webm";
  if (start.startsWith("OggS") && file.type.startsWith("audio/")) return "audio/ogg";
  return null;
}

export async function sendAttachment(uid, other, body, filename, mime, bytes) {
  const id = randomUUID();
  const [, rows] = await sql.transaction([
    sql`SELECT user_id FROM community_profiles WHERE user_id = ${uid} FOR UPDATE`,
    sql(`INSERT INTO community_messages (id, sender, recipient, body)
      SELECT $3, $1, $2, $4 WHERE ${friendAccess}
      AND (SELECT coalesce(sum(octet_length(bytes)), 0) FROM community_chat_files WHERE sender = $1) + $5::int <= 30000000
      RETURNING id, sender, body, created_at`, [uid, other, id, body, bytes.length]),
    sql`INSERT INTO community_chat_files (message_id, sender, filename, mime, bytes)
      SELECT id, sender, ${filename}, ${mime}, decode(${bytes.toString("base64")}, 'base64')
      FROM community_messages WHERE id = ${id}`,
  ]);
  return rows[0] && { ...rows[0], filename, mime };
}

export function readAttachment(uid, id) {
  return sql(`SELECT attachment.filename, attachment.mime, encode(attachment.bytes, 'base64') AS media
    FROM community_chat_files attachment JOIN community_messages m ON m.id = attachment.message_id
    WHERE m.id = $2 AND $1::uuid IN (m.sender, m.recipient)
      AND EXISTS (SELECT FROM community_friendships f WHERE f.accepted
        AND f.user_a = least(m.sender, m.recipient) AND f.user_b = greatest(m.sender, m.recipient))
      AND NOT EXISTS (SELECT FROM community_blocks b WHERE
        (b.blocker = m.sender AND b.blocked = m.recipient) OR (b.blocker = m.recipient AND b.blocked = m.sender))`, [uid, id]);
}
