"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import { communityRequest } from "./api";
import Chat from "./Chat";
import { Avatar, button, card, dateLabel, field, Notice } from "./controls";

export default function Inbox({ peer, userId, onSelect, onFind }) {
  const [threads, setThreads] = useState(null);
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function update() {
      try {
        if (!document.hidden) {
          const result = await communityRequest("inbox", { signal: controller.signal });
          if (!controller.signal.aborted) {
            setThreads(result.conversations);
            setError("");
          }
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(update, 7000);
      }
    }
    update();
    return () => { controller.abort(); clearTimeout(timer); };
  }, []);

  const term = query.trim().toLowerCase().replace(/^@/, "");
  const visible = threads?.filter(thread =>
    (!unreadOnly || thread.unread > 0) &&
    (!term || thread.handle.includes(term) || thread.display_name.toLowerCase().includes(term)));

  return <div className={`community-inbox ${peer ? "has-conversation" : ""}`}>
    <section className={`${card} community-inbox-list grid min-w-0 gap-3`} aria-label="Bandeja de mensajes">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Mensajes</h2>
        <button className={button} type="button" onClick={onFind}>Nuevo chat</button>
      </div>
      <label className="relative block">
        <Search className="absolute left-3 top-3 text-[var(--sub)]" size={17} aria-hidden="true" />
        <input className={field + " !pl-9"} value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar conversaciones" placeholder="Buscar conversaciones" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className={button} aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>Todos</button>
        <button className={button} aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>No leídos</button>
      </div>
      <Notice error={error} />
      {!threads && !error && <p role="status" className="text-sm">Cargando conversaciones…</p>}
      {visible?.length === 0 && <p className="text-sm text-[var(--sub)]">{unreadOnly ? "No tienes mensajes sin leer." : term ? "No hay conversaciones que coincidan." : "Agrega amistades para empezar una conversación."}</p>}
      <div className="community-thread-scroll">
        {visible?.map(thread => <button key={thread.user_id} className="community-thread" aria-current={peer?.user_id === thread.user_id ? "true" : undefined}
          onClick={() => onSelect(thread)}>
          <Avatar person={thread} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{thread.display_name}</span>
            <span className="block truncate text-xs text-[var(--sub)]">{thread.last_sender === userId && "Tú: "}{thread.last_body || `@${thread.handle}`}</span>
          </span>
          <span className="grid shrink-0 justify-items-end gap-1 text-[0.65rem] text-[var(--sub)]">
            {thread.last_at && <time dateTime={thread.last_at}>{dateLabel(thread.last_at)}</time>}
            {thread.unread > 0 && <span className="community-count" aria-label={`${thread.unread} mensajes sin leer`}>{thread.unread > 99 ? "99+" : thread.unread}</span>}
          </span>
        </button>)}
      </div>
    </section>
    {peer ? <Chat key={peer.user_id} peer={peer} userId={userId} onBack={() => onSelect(null)} onRead={() =>
      setThreads(items => items?.map(thread => thread.user_id === peer.user_id ? { ...thread, unread: 0 } : thread) ?? null)} />
      : <div className="community-empty community-inbox-placeholder">
        <div className="community-empty-icon"><MessageCircle aria-hidden="true" size={26} /></div>
        <p className="font-semibold">Selecciona una conversación</p>
      </div>}
  </div>;
}
