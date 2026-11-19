import { createPost, deletePost, listPosts, reportPost } from "@/lib/community/content";
import { clean, communityRoute, error, json, uuid } from "@/lib/community/http";

export const GET = communityRoute(async (_request, uid) => json({ posts: await listPosts(uid) }));

function mediaType(bytes) {
  if (bytes.length < 12) return null;
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (bytes.toString("ascii", 4, 8) === "ftyp") return "video/mp4";
  return null;
}

export const POST = communityRoute(async (request, uid) => {
  if (request.headers.get("content-type")?.startsWith("application/json")) {
    const { report } = (await request.json()) || {};
    if (!uuid(report)) return error("Publicación inválida.");
    await reportPost(uid, report);
    return json({ ok: true });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return error("Publicación inválida.");
  const body = clean(form.get("body"));
  const file = form.get("media");
  let media = null;
  let type = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 3000000) return error("El archivo debe pesar hasta 3 MB.", 413);
    const bytes = Buffer.from(await file.arrayBuffer());
    type = mediaType(bytes);
    if (!type) return error("Adjunta una imagen JPG, PNG o WebP, o un video MP4.");
    media = bytes.toString("base64");
  }
  if (body.length > 1500 || (!body && !media)) return error("Escribe hasta 1500 caracteres o adjunta un archivo.");
  const post = await createPost(uid, body, type, media);
  if (!post) return error("Activa tu perfil social o libera espacio borrando publicaciones propias.", 409);
  return json({ post }, { status: 201 });
});

export const DELETE = communityRoute(async (request, uid) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!uuid(id)) return error("Publicación inválida.");
  const [deleted] = await deletePost(uid, id);
  return deleted ? json({ ok: true }) : error("Publicación no disponible.", 404);
});
