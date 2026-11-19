"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LockKeyhole, Send } from "lucide-react";
import { communityRequest, sendJson } from "./api";
import { Avatar, button, card, field, Notice, primary } from "./controls";

const clock = new Intl.DateTimeFormat("es", { hour: "numeric", minute: "2-digit" });
const day = new Intl.DateTimeFormat("es", { day: "numeric", month: "long" });

export default function Chat({ peer, userId, onBack, onRead }) {
  const [messages, setMessages] = useState(null);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const list = useRef(null);
  const latestRead = useRef(null);
  const readCallback = useRef(onRead);
  useEffect(() => { readCallback.current = onRead; }, [onRead]);

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function poll() {
      try {
        if (!document.hidden) {
          const { messages: fresh } = await communityRequest(`messages?with=${peer.user_id}`, { signal: controller.signal });
          if (controller.signal.aborted) return;
          setMessages(previous => previous?.map(item => item.id).join() === fresh.map(item => item.id).join() ? previous : fresh);
          const incoming = fresh.findLast(message => message.sender === peer.user_id);
          if (incoming && incoming.id !== latestRead.current) {
            await sendJson("inbox", { peer: peer.user_id, message: incoming.id });
            if (controller.signal.aborted) return;
            latestRead.current = incoming.id;
            readCallback.current?.();
          }
          setError("");
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 5000);
      }
    }
    poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [peer.user_id]);

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [messages]);

  async function send(event) {
    event.preventDefault();
    if (pending || !body.trim()) return;
    setPending(true);
    setError("");
    try {
      const { message } = await sendJson("messages", { other: peer.user_id, body });
      setMessages(previous => previous?.some(item => item.id === message.id) ? previous : [...(previous || []), message]);
      setBody("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }

  return <section className={`${card} community-chat min-w-0 !p-0`} aria-label="Conversación">
    <header className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
      <button className={button} aria-label="Volver a mensajes" onClick={onBack}><ArrowLeft aria-hidden="true" size={19} /></button>
      <Avatar person={peer} />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold">{peer.display_name}</h2>
        <p className="truncate text-xs text-[var(--sub)]">@{peer.handle}</p>
      </div>
      <LockKeyhole size={16} className="text-[var(--sub)]" aria-label="Chat privado" />
    </header>
    {error && <div className="px-3 pt-2"><Notice error={error} /></div>}
    <div ref={list} className="community-chat-log" role="log" aria-label="Mensajes de la conversación">
      {!messages && !error && <p role="status" className="text-sm">Cargando mensajes…</p>}
      {messages?.length === 0 && <p className="community-chat-day">Envía el primer mensaje.</p>}
      {messages?.map((message, index) => {
        const date = new Date(message.created_at);
        const previous = messages[index - 1];
        const newDay = !previous || new Date(previous.created_at).toDateString() !== date.toDateString();
        const mine = message.sender === userId;
        return <div key={message.id} className="grid min-w-0 gap-2">
          {newDay && <time className="community-chat-day" dateTime={message.created_at}>{day.format(date)}</time>}
          <div className={`community-bubble ${mine ? "is-mine" : ""}`}>
            <span className="sr-only">{mine ? "Tú: " : `@${peer.handle}: `}</span>
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            <time className="mt-0.5 block text-right text-[0.65rem] opacity-80" dateTime={message.created_at}>{clock.format(date)}</time>
          </div>
        </div>;
      })}
    </div>
    <form className="flex min-w-0 items-end gap-2 border-t border-[var(--border)] p-3" onSubmit={send}>
      <textarea className={field + " max-h-32 resize-y"} rows={1} aria-label="Mensaje" placeholder="Escribe un mensaje"
        value={body} onChange={event => setBody(event.target.value)} maxLength={1000} />
      <button className={primary} aria-label="Enviar mensaje" disabled={pending || !body.trim()}><Send aria-hidden="true" size={17} /></button>
    </form>
  </section>;
}
