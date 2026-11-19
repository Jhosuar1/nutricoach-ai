"use client";

import { useEffect, useState } from "react";
import { communityRequest, sendJson } from "./api";
import { Avatar, button, field, Notice, primary } from "./controls";

export default function Comments({ postId, userId, onCount }) {
  const [comments, setComments] = useState(null);
  const [body, setBody] = useState("");
  const [reply, setReply] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const path = `interactions?post=${postId}`;

  useEffect(() => {
    const controller = new AbortController();
    communityRequest(path, { signal: controller.signal }).then(data => setComments(data.comments)).catch(failure => {
      if (!controller.signal.aborted) setError(failure.message);
    });
    return () => controller.abort();
  }, [path]);

  async function change(payload, delta) {
    setBusy(true);
    setError("");
    try {
      await sendJson("interactions", { post: postId, ...payload });
      if (delta > 0) { setBody(""); setReply(null); }
      onCount(delta);
      setComments((await communityRequest(path)).comments);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  const groups = comments?.filter(comment => !comment.parent_id).flatMap(parent => [
    parent, ...comments.filter(comment => comment.parent_id === parent.id),
  ]) ?? [];
  const orphans = comments?.filter(comment => comment.parent_id && !comments.some(parent => parent.id === comment.parent_id)) ?? [];

  return <section className="grid gap-3 border-t border-[var(--border)] px-4 py-3" aria-label="Comentarios">
    <Notice error={error} />
    {comments === null && !error && <p role="status" className="text-sm">Cargando comentarios…</p>}
    {comments?.length === 0 && <p className="text-sm text-[var(--sub)]">Sé la primera persona en comentar.</p>}
    {[...groups, ...orphans].map(comment => <div key={comment.id} className={`flex min-w-0 items-start gap-2 ${comment.parent_id ? "ml-5 border-l border-[var(--border)] pl-2" : ""}`}>
      <Avatar person={comment} small />
      <div className="min-w-0 flex-1 break-words text-sm">
        <p className="font-semibold">{comment.display_name}</p>
        <p className="whitespace-pre-wrap">{comment.body}</p>
        {!comment.parent_id && <button className="py-2 text-xs font-semibold underline" type="button" onClick={() => setReply(comment)}>Responder</button>}
      </div>
      {comment.author === userId && <button type="button" className={button} disabled={busy}
        onClick={() => change({ action: "delete-comment", comment: comment.id }, -1)}>Borrar</button>}
    </div>)}
    {reply && <div className="flex items-center justify-between gap-2 text-sm">
      <span>Respondiendo a @{reply.handle}</span><button className={button} onClick={() => setReply(null)}>Cancelar</button>
    </div>}
    <form className="flex min-w-0 gap-2" onSubmit={event => {
      event.preventDefault();
      if (!busy && body.trim()) change({ action: "comment", body, parent: reply?.id }, 1);
    }}>
      <input className={field} value={body} maxLength={500} onChange={event => setBody(event.target.value)}
        placeholder="Escribe un comentario" aria-label="Escribe un comentario" />
      <button className={primary} disabled={busy || !body.trim()}>Enviar</button>
    </form>
  </section>;
}
