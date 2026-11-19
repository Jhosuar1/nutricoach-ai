"use client";

import { useEffect, useRef, useState } from "react";
import { communityRequest, sendJson } from "./api";
import { button, card, field, Notice, primary } from "./controls";

export default function Chat({ peer, userId, onBack }) {
  const [messages, setMessages] = useState(null);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const list = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function poll() {
      try {
        if (!document.hidden) {
          const data = await communityRequest(`messages?with=${peer.user_id}`, { signal: controller.signal });
          if (!controller.signal.aborted) {
            setMessages(previous => {
              const last = previous?.at(-1);
              return last && last.id === data.messages.at(-1)?.id ? previous : data.messages;
            });
          }
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 5000);
      }
    }

    poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
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
      setMessages(previous => previous?.some(item => item.id === message.id)
        ? previous : [...(previous || []), message]);
      setBody("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }

  return <section className={`${card} grid gap-3`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="min-w-0 break-all font-semibold">@{peer.handle}</h2>
      <button className={button} onClick={onBack}>Volver a amistades</button>
    </div>
    <Notice error={error} />
    <div ref={list} className="grid max-h-[48dvh] min-h-24 auto-rows-min gap-2 overflow-y-auto" role="log" aria-label="Conversación">
      {!messages && !error && <p role="status">Cargando mensajes…</p>}
      {messages?.length === 0 && <p className="text-sm text-[var(--sub)]">Aún no hay mensajes.</p>}
      {messages?.map(message => <p key={message.id} className={`max-w-[88%] whitespace-pre-wrap break-words rounded-xl border border-[var(--border)] px-3 py-2 text-sm ${message.sender === userId ? "justify-self-end bg-[#6655de] text-white" : "justify-self-start"}`}>
        <span className="sr-only">{message.sender === userId ? "Tú: " : `@${peer.handle}: `}</span>{message.body}
      </p>)}
    </div>
    <form className="grid gap-2" onSubmit={send}>
      <label className="grid gap-1 text-sm">Mensaje
        <textarea className={field} rows={2} value={body} onChange={event => setBody(event.target.value)} maxLength={1000} />
      </label>
      <button className={primary} disabled={pending || !body.trim()}>Enviar</button>
    </form>
  </section>;
}
