"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { communityRequest, sendJson } from "./api";
import { button, card, field, Notice, Person, primary } from "./controls";

export default function Feed({ userId }) {
  const [posts, setPosts] = useState(null);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);

  const reload = useCallback(async () => {
    setError("");
    try {
      setPosts((await communityRequest("posts")).posts);
    } catch (failure) {
      setError(failure.message);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  async function mutate(action) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  function publish(event) {
    event.preventDefault();
    mutate(async () => {
      if (file && file.size > 3000000) throw new Error("El archivo debe pesar hasta 3 MB.");
      const form = new FormData();
      form.set("body", body);
      if (file) form.set("media", file);
      await communityRequest("posts", { method: "POST", body: form });
      setBody("");
      setFile(null);
      fileInput.current.value = "";
      await reload();
    });
  }

  return <div className="grid gap-3">
    <form onSubmit={publish} className={`${card} grid gap-3`}>
      <label className="grid gap-1 text-sm">Nueva publicación
        <textarea className={field} value={body} onChange={event => setBody(event.target.value)} maxLength={1500} rows={3} placeholder="Comparte algo con tus amistades" />
      </label>
      <label className="grid gap-1 text-sm">Foto o video MP4 · hasta 3 MB
        <input ref={fileInput} className="max-w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp,video/mp4" onChange={event => setFile(event.target.files[0] ?? null)} />
      </label>
      <button className={primary} disabled={busy || (!body.trim() && !file)}>Publicar</button>
    </form>
    <Notice error={error} onRetry={reload} />
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {!posts && !error && <p role="status">Cargando publicaciones…</p>}
    {posts?.length === 0 && <p className="text-sm text-[var(--sub)]">Aquí aparecerán tus publicaciones y las de tus amistades.</p>}
    {posts?.map(post => {
      const media = `/api/community/media?id=${post.id}`;
      const mine = post.author === userId;
      return <article key={post.id} className={`${card} grid gap-3`}>
        <Person person={post} />
        {post.body && <p className="whitespace-pre-wrap break-words">{post.body}</p>}
        {post.media_type?.startsWith("image/") && <img className="max-h-96 w-full rounded-xl object-contain" alt="Imagen de la publicación" src={media} loading="lazy" />}
        {post.media_type === "video/mp4" && <video className="max-h-96 w-full rounded-xl" controls playsInline preload="none" src={media} aria-label="Video de la publicación" />}
        <div className="flex justify-end">
          {mine ? <button type="button" className={button} disabled={busy} onClick={() => {
            if (window.confirm("¿Eliminar esta publicación?")) mutate(async () => {
              await communityRequest(`posts?id=${post.id}`, { method: "DELETE" });
              await reload();
            });
          }}>Eliminar</button> : <button className={button} disabled={busy} onClick={() => mutate(async () => {
            await sendJson("posts", { report: post.id });
            setPosts(items => items.filter(item => item.id !== post.id));
            setNotice("Reporte recibido.");
          })}>Reportar</button>}
        </div>
      </article>;
    })}
  </div>;
}
