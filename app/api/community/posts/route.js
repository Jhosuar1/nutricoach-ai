import { createPost, deletePost, listPosts, reportPost } from "@/lib/community/content";
import { clean, communityRoute, error, json, uuid } from "@/lib/community/http";

export const GET = communityRoute(async (request, uid) => {
  const params = new URL(request.url).searchParams;
  const scope = params.get("scope") || "all";
  const query = clean(params.get("q"));
  const before = params.get("before");
  if (!["all", "video", "saved", "mine"].includes(scope) || query.length > 80 || (before && !uuid(before))) {
    return error("Filtros inválidos.");
  }
  const rows = await listPosts(uid, scope, query, before || null);
  const posts = rows.slice(0, 20);
  return json({ posts, next: rows.length > 20 ? posts.at(-1).id : null });
});

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
  const selected = form.getAll("media").filter(file => file instanceof File && file.size > 0);
  if (selected.length > 4 || selected.reduce((total, file) => total + file.size, 0) > 3000000) {
    return error("Adjunta hasta 4 fotos o un video con un máximo de 3 MB en total.", 413);
  }
  const files = [];
  for (const file of selected) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const type = mediaType(bytes);
    if (!type) return error("Usa imágenes JPG, PNG o WebP, o video MP4.");
    if (type === "video/mp4" && selected.length > 1) return error("Publica un video o una galería de fotos.");
    files.push({ type, media: bytes.toString("base64"), size: file.size });
  }
  if (body.length > 1500 || (!body && !files.length)) return error("Escribe hasta 1500 caracteres o adjunta un archivo.");
  const post = await createPost(uid, body, files);
  if (!post) return error("Activa tu perfil social o libera espacio borrando publicaciones propias.", 409);
  return json({ post }, { status: 201 });
});

export const DELETE = communityRoute(async (request, uid) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!uuid(id)) return error("Publicación inválida.");
  const [deleted] = await deletePost(uid, id);
  return deleted ? json({ ok: true }) : error("Publicación no disponible.", 404);
});
