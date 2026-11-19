import { createComment, deleteComment, readComments, setReaction } from "@/lib/community/engagement";
import { clean, communityRoute, error, json, uuid } from "@/lib/community/http";

export const GET = communityRoute(async (request, uid) => {
  const post = new URL(request.url).searchParams.get("post");
  if (!uuid(post)) return error("Publicación inválida.");
  return json({ comments: (await readComments(uid, post)).reverse() });
});

export const POST = communityRoute(async (request, uid) => {
  const input = (await request.json()) || {};
  if (input.action === "delete-comment" && uuid(input.comment)) {
    await deleteComment(uid, input.comment);
    return json({ ok: true });
  }
  if (!uuid(input.post)) return error("Publicación inválida.");
  if (["like", "save"].includes(input.action) && typeof input.enabled === "boolean") {
    const rows = await setReaction(uid, input.post, input.action, input.enabled);
    if (input.enabled && !rows.length) return error("Publicación no disponible.", 404);
    return json({ ok: true });
  }
  const body = clean(input.body);
  if (input.action !== "comment" || !body || body.length > 500) return error("Escribe un comentario de hasta 500 caracteres.");
  const [comment] = await createComment(uid, input.post, body);
  return comment ? json({ comment }, { status: 201 }) : error("Publicación no disponible.", 404);
});
