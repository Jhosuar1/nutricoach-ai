"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LockKeyhole, Paperclip, Send, Video } from "lucide-react";
import ChatAttachment from "./ChatAttachment";
import VoiceRecorder from "./VoiceRecorder";
import { communityRequest, sendJson } from "./api";
import { Avatar, button, card, field, Notice, primary } from "./controls";

const clock = new Intl.DateTimeFormat("es", { hour: "numeric", minute: "2-digit" });
const day = new Intl.DateTimeFormat("es", { day: "numeric", month: "long" });

export default function Chat({ peer, userId, onBack, onRead, onCall, messageVersion }) {
  const [messages, setMessages] = useState(null);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const picker = useRef(null);
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
  }, [peer.user_id, messageVersion]);

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!file?.type.startsWith("audio/")) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(next) {
    if (!next) return;
    if (next.size > 3000000) { setError("El archivo debe pesar hasta 3 MB."); return; }
    setError("");
    setFile(next);
  }

  async function send(event) {
    event.preventDefault();
    if (pending || (!body.trim() && !file)) return;
    setPending(true);
    setError("");
    try {
      const form = new FormData();
      if (file) {
        form.set("other", peer.user_id);
        form.set("body", body);
        form.set("file", file);
      }
      const { message } = file
        ? await communityRequest("messages", { method: "POST", body: form })
        : await sendJson("messages", { other: peer.user_id, body });
      setMessages(previous => previous?.some(item => item.id === message.id) ? previous : [...(previous || []), message]);
      setBody("");
      setFile(null);
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
      <button className={button} aria-label="Iniciar videollamada" onClick={() => onCall(peer)}><Video size={18} /></button>
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
            <ChatAttachment message={message} />
            {message.body && <p className="whitespace-pre-wrap break-words">{
              /^https?:/.test(message.body) && message.body.startsWith(window.location.origin + "/?post=")
                && /^https?:[^\s]+\/\?post=[a-f0-9-]{36}$/i.test(message.body)
                ? <a href={message.body} className="underline">Abrir publicación compartida</a>
                : message.body
            }</p>}
            <time className="mt-0.5 block text-right text-[0.65rem] opacity-80" dateTime={message.created_at}>{clock.format(date)}</time>
          </div>
        </div>;
      })}
    </div>
    <form className="grid gap-2 border-t border-[var(--border)] p-3" onSubmit={send}>
      {file && <div className="grid gap-1 rounded-xl bg-[var(--bg)] p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 break-all text-xs">{file.name}</span>
          <button className={button} type="button" disabled={pending} onClick={() => setFile(null)}>Quitar</button>
        </div>
        {preview && <audio className="max-w-full" src={preview} controls aria-label="Vista previa de la nota de voz" />}
      </div>}
      <div className="flex min-w-0 flex-wrap items-end gap-2">
        <input className="sr-only" type="file" ref={picker} tabIndex={-1} aria-label="Seleccionar adjunto"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,.pdf,.zip"
          onChange={event => { selectFile(event.target.files[0]); event.target.value = ""; }} />
        <button className={button} type="button" disabled={pending} aria-label="Adjuntar archivo" onClick={() => picker.current.click()}><Paperclip size={17} /></button>
        <VoiceRecorder disabled={pending} onRecord={selectFile} onError={setError} />
        <textarea className={field + " max-h-32 flex-1 resize-y"} rows={1} aria-label="Mensaje" placeholder="Escribe un mensaje"
          value={body} onChange={event => setBody(event.target.value)} maxLength={1000} />
        <button className={primary} aria-label="Enviar mensaje" disabled={pending || (!body.trim() && !file)}><Send size={17} /></button>
      </div>
    </form>
  </section>;
}
