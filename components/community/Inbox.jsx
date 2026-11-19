"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Search, SquarePen, UserRoundSearch, Users } from "lucide-react";
import { communityRequest } from "./api";
import Chat from "./Chat";
import ActionPanel from "./ActionPanel";
import { Avatar, button, card, dateLabel, field, Notice } from "./controls";

export default function Inbox({ peer, userId, onSelect, onFind, onCall, messageRevision, messageVersion }) {
  const [threads, setThreads] = useState(null);
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState("");
  const search = useRef(null);

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
  }, [messageRevision]);

  const unread = threads?.filter(thread => thread.unread > 0).length || 0;
  const term = query.trim().toLowerCase().replace(/^@/, "");
  const visible = threads?.filter(thread =>
    (!unreadOnly || thread.unread > 0) &&
    (!term || thread.handle.includes(term) || thread.display_name.toLowerCase().includes(term)));

  return <div className={`community-inbox ${peer ? "has-conversation" : ""}`}>
    <section className={`${card} community-inbox-list grid min-w-0 gap-4`} aria-label="Bandeja de mensajes">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Mensajes</h2>
        <ActionPanel title="Nuevo chat" label="Nuevo" Icon={SquarePen} className={button} items={[
          { Icon: Users, label: "Elegir una amistad", action: () => {
            setUnreadOnly(false); setQuery(""); search.current?.focus();
          } },
          { Icon: UserRoundSearch, label: "Buscar personas", action: onFind },
        ]} />
      </div>
      <label className="relative block">
        <Search className="absolute left-3 top-3 text-[var(--sub)]" size={17} aria-hidden="true" />
        <input ref={search} type="search" className={field + " !pl-9"} value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar conversaciones" placeholder="Buscar conversaciones" />
      </label>
      {!term && !!threads?.length && <div className="grid gap-2">
        <h3 className="text-xs font-semibold text-[var(--sub)]">Contactos rápidos</h3>
        <div className="community-quick-contacts">
          {threads.slice(0, 8).map(thread => <button key={thread.user_id} type="button"
            aria-label={`Abrir chat con ${thread.display_name}`} onClick={() => onSelect(thread)}>
            <span className="community-quick-photo"><Avatar person={thread} />
              {thread.unread > 0 && <span className="community-unread-dot" />}
            </span>
            <span className="w-full truncate text-xs">{thread.display_name}</span>
          </button>)}
        </div>
      </div>}
      <div className="community-inbox-filters" aria-label="Filtrar bandeja">
        <button className={button} aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>Bandeja</button>
        <button className={button} aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>No leídos{unread > 0 && <span className="community-count">{unread}</span>}</button>
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
    {peer ? <Chat key={peer.user_id} peer={peer} userId={userId} messageVersion={messageVersion} onCall={onCall} onBack={() => onSelect(null)} onRead={() =>
      setThreads(items => items?.map(thread => thread.user_id === peer.user_id ? { ...thread, unread: 0 } : thread) ?? null)} />
      : <div className="community-empty community-inbox-placeholder">
        <div className="community-empty-icon"><MessageCircle aria-hidden="true" size={26} /></div>
        <p className="font-semibold">Selecciona una conversación</p>
      </div>}
  </div>;
}
