import { binaryResponse } from "@/lib/community/binary";
import { readAttachment } from "@/lib/community/chat-files";
import { communityRoute, error, uuid } from "@/lib/community/http";

export const GET = communityRoute(async (request, uid) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!uuid(id)) return error("Archivo inválido.");
  const [attachment] = await readAttachment(uid, id);
  if (!attachment) return error("Archivo no disponible.", 404);
  const inline = /^(image|audio|video)\//.test(attachment.mime);
  return binaryResponse(request, { ...attachment, filename: inline ? undefined : attachment.filename });
});
