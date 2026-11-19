import { binaryResponse } from "@/lib/community/binary";
import { readMedia } from "@/lib/community/content";
import { communityRoute, error, uuid } from "@/lib/community/http";

export const GET = communityRoute(async (request, uid) => {
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const index = params.get("index") ?? "0";
  if (!uuid(id) || !/^[0-3]$/.test(index)) return error("Archivo inválido.");
  const [row] = await readMedia(uid, id, Number(index));
  if (!row) return error("Archivo no disponible.", 404);

  return binaryResponse(request, { media: row.media, mime: row.media_type });
});
