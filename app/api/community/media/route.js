import { readMedia } from "@/lib/community/content";
import { communityRoute, error, uuid } from "@/lib/community/http";

export const GET = communityRoute(async (request, uid) => {
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const index = params.get("index") ?? "0";
  if (!uuid(id) || !/^[0-3]$/.test(index)) return error("Archivo inválido.");
  const [row] = await readMedia(uid, id, Number(index));
  if (!row) return error("Archivo no disponible.", 404);

  const bytes = Buffer.from(row.media, "base64");
  const headers = {
    "Content-Type": row.media_type,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };
  const range = request.headers.get("range");
  if (!range) {
    return new Response(bytes, { headers: { ...headers, "Content-Length": String(bytes.length) } });
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const start = match?.[1] ? Number(match[1]) : Math.max(0, bytes.length - Number(match?.[2]));
  const end = match?.[1] && match[2] ? Math.min(Number(match[2]), bytes.length - 1) : bytes.length - 1;
  if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || start > end) {
    return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${bytes.length}` } });
  }
  const part = bytes.subarray(start, end + 1);
  return new Response(part, { status: 206, headers: {
    ...headers,
    "Content-Length": String(part.length),
    "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
  } });
});
