"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Film, Heart, ImagePlus, LockKeyhole, MessageCircle, MoreHorizontal, Plus, Repeat2, Share2 } from "lucide-react";
import { communityRequest, sendJson } from "./api";
import { Avatar, button, card, dateLabel, Notice, primary } from "./controls";
import Comments from "./Comments";

function Post({ post, userId, onPatch, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);
  const media = `/api/community/media?id=${post.id}&index=${photo}`;
  const totalPhotos = 1 + (post.extra_photos || 0);
  const mine = post.author === userId;

  async function run(action) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const url = new URL("/", window.location.origin);
    url.searchParams.set("post", post.id);
    try {
      if (navigator.share) await navigator.share({ title: "Publicación de NutriCoach", url: url.href });
      else {
        await navigator.clipboard.writeText(url.href);
        setShared(true);
      }
    } catch (failure) {
      if (failure.name !== "AbortError") setError("No se pudo compartir el enlace.");
    }
  }

  return <article className={`${card} community-post !p-0`}>
    {post.reposted_by && <p className="flex items-center gap-2 px-4 pt-3 text-xs text-[var(--sub)]"><Repeat2 size={15} /> Republicado por {post.reposted_by}</p>}
    <header className="flex items-center gap-3 px-4 py-3">
      <Avatar person={post} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{post.display_name}</p>
        <p className="truncate text-xs text-[var(--sub)]">@{post.handle} · {dateLabel(post.created_at)}</p>
      </div>
      <details className="community-menu relative">
        <summary className={button} aria-label="Opciones de publicación"><MoreHorizontal aria-hidden="true" size={20} /></summary>
        <div className="absolute right-0 top-full z-10 mt-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg">
          {mine ? <button className={button} disabled={busy} onClick={() => {
            if (window.confirm("¿Eliminar esta publicación?")) run(async () => {
              await communityRequest(`posts?id=${post.id}`, { method: "DELETE" });
              onRemove("Publicación eliminada.");
            });
          }}>Eliminar</button> : <button className={button} disabled={busy} onClick={() => {
            if (window.confirm("¿Reportar y ocultar esta publicación?")) run(async () => {
              await sendJson("posts", { report: post.id });
              onRemove("Reporte recibido.");
            });
          }}>Reportar</button>}
        </div>
      </details>
    </header>
    {post.body && <p className="whitespace-pre-wrap break-words px-4 pb-3 text-[0.9375rem] leading-relaxed">{post.body}</p>}
    {post.media_type?.startsWith("image/") && <div className="relative">
      <img className="max-h-[60dvh] w-full bg-black/15 object-contain" alt="Imagen de la publicación" src={media} loading="lazy" />
      {totalPhotos > 1 && <div className="flex items-center justify-center gap-3 bg-[var(--bg)] px-3 py-1">
        <button className={button} disabled={!photo} aria-label="Foto anterior" onClick={() => setPhoto(value => value - 1)}><ChevronLeft aria-hidden="true" size={18} /></button>
        <span className="text-xs text-[var(--sub)]" aria-live="polite">{photo + 1} / {totalPhotos}</span>
        <button className={button} disabled={photo === totalPhotos - 1} aria-label="Foto siguiente" onClick={() => setPhoto(value => value + 1)}><ChevronRight aria-hidden="true" size={18} /></button>
      </div>}
    </div>}
    {post.media_type === "video/mp4" && <video className="max-h-[65dvh] w-full bg-black object-contain" controls playsInline preload="none" src={media} aria-label="Video de la publicación" />}
    <div className="flex flex-wrap items-center gap-1 border-t border-[var(--border)] px-2 py-1">
      <button className={button} disabled={busy} aria-pressed={post.liked} aria-label="Me gusta" onClick={() => run(async () => {
        await sendJson("interactions", { post: post.id, action: "like", enabled: !post.liked });
        onPatch({ liked: !post.liked, likes: Math.max(0, post.likes + (post.liked ? -1 : 1)) });
      })}><Heart aria-hidden="true" size={18} fill={post.liked ? "currentColor" : "none"} className={post.liked ? "text-rose-500" : ""} /> {post.likes}</button>
      <button className={button} aria-expanded={expanded} aria-label="Comentarios" onClick={() => setExpanded(value => !value)}>
        <MessageCircle aria-hidden="true" size={18} /> {post.comments}
      </button>
      {!mine && <button className={button} disabled={busy} aria-pressed={post.reposted} aria-label="Republicar"
        onClick={() => run(async () => {
          await sendJson("interactions", { post: post.id, action: "repost", enabled: !post.reposted });
          onPatch({ reposted: !post.reposted });
        })}><Repeat2 size={18} aria-hidden="true" /></button>}
      <button className={button} aria-label="Compartir publicación" onClick={share}>
        <Share2 size={18} aria-hidden="true" />
      </button>
      <button className={button + " ml-auto"} disabled={busy} aria-pressed={post.saved} aria-label="Guardar publicación" onClick={() => run(async () => {
        await sendJson("interactions", { post: post.id, action: "save", enabled: !post.saved });
        onPatch({ saved: !post.saved });
      })}><Bookmark aria-hidden="true" size={18} fill={post.saved ? "currentColor" : "none"} /></button>
    </div>
    {shared && <p className="px-4 pb-2 text-sm" role="status">Enlace copiado. Solo funciona para quienes tienen acceso.</p>}
    {error && <div className="px-3 py-2"><Notice error={error} /></div>}
    {expanded && <Comments postId={post.id} userId={userId} onCount={delta => onPatch({ comments: Math.max(0, post.comments + delta) })} />}
  </article>;
}

const empty = {
  all: "Las publicaciones de tus amistades aparecerán aquí.",
  video: "Todavía no hay videos de tus amistades.",
  saved: "Las publicaciones que guardes aparecerán aquí.",
  mine: "Tus publicaciones aparecerán aquí.",
};

export default function Feed({ profile, scope = "all", query = "", revision = 0, onCompose, postId }) {
  const [posts, setPosts] = useState(null);
  const [next, setNext] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const active = useRef(null);

  const load = useCallback(async (before = null) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const params = new URLSearchParams({ scope, q: query });
    if (before) params.set("before", before);
    if (postId) params.set("id", postId);
    setError("");
    setLoading(true);
    try {
      const data = await communityRequest(`posts?${params}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setPosts(previous => before ? [...(previous || []), ...data.posts] : data.posts);
      setNext(data.next);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [scope, query, postId]);

  useEffect(() => {
    setPosts(null);
    setNext(null);
    load();
    return () => active.current?.abort();
  }, [load, revision]);

  return <section className="grid min-w-0 gap-4" aria-label="Publicaciones">
    {scope === "all" && !query && onCompose && <div className={`${card} grid gap-3`}>
      <div className="flex items-center gap-3">
        <Avatar person={profile} />
        <button onClick={() => onCompose("post")} className="community-input min-h-11 flex-1 text-left text-sm text-[var(--sub)]">¿Qué quieres compartir?</button>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-2">
        <button className={button} onClick={() => onCompose("photo")}><ImagePlus aria-hidden="true" size={17} /> Foto</button>
        <button className={button} onClick={() => onCompose("video")}><Film aria-hidden="true" size={17} /> Video</button>
        <span className="ml-auto flex items-center gap-1 text-xs text-[var(--sub)]"><LockKeyhole aria-hidden="true" size={13} /> Amistades</span>
      </div>
    </div>}
    <Notice error={error} onRetry={() => load()} />
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {!posts && !error && <p role="status" className="community-empty">Cargando publicaciones…</p>}
    {posts?.length === 0 && <div className="community-empty">
      <div className="community-empty-icon">{scope === "video" ? <Film aria-hidden="true" size={24} /> : scope === "saved" ? <Bookmark aria-hidden="true" size={24} /> : <ImagePlus aria-hidden="true" size={24} />}</div>
      <p className="font-semibold">{postId ? "Publicación no disponible" : query ? "Sin resultados" : "Todavía no hay publicaciones"}</p>
      <p className="text-sm text-[var(--sub)]">{postId ? "El enlace requiere acceso a la publicación." : query ? "Prueba con otras palabras." : empty[scope]}</p>
      {onCompose && !query && ["all", "mine", "video"].includes(scope) && <button className={primary} onClick={() => onCompose(scope === "video" ? "video" : "post")}><Plus aria-hidden="true" size={17} /> Crear publicación</button>}
    </div>}
    {posts?.map(post => <Post key={post.id} post={post} userId={profile.user_id}
      onPatch={patch => setPosts(items => items.map(item => item.id === post.id ? { ...item, ...patch } : item)
        .filter(item => scope !== "saved" || item.saved))}
      onRemove={message => {
        setPosts(items => items.filter(item => item.id !== post.id));
        setNotice(message);
      }} />)}
    {next && <button className={button} disabled={loading} onClick={() => load(next)}>{loading ? "Cargando…" : "Ver más publicaciones"}</button>}
  </section>;
}
