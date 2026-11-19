import { Bell } from "lucide-react";
import { Avatar, button, card, dateLabel } from "./controls";

const descriptions = {
  accepted: "aceptó tu solicitud de amistad",
  friend: "te envió una solicitud de amistad",
  comment: "comentó o respondió en una publicación",
  like: "le dio Me gusta a tu publicación",
  repost: "republicó tu publicación",
  message: "te envió un mensaje",
};

export default function Activity({ events, onOpen, onRead }) {
  return <section className={`${card} grid gap-3`} aria-label="Notificaciones">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold">Notificaciones</h2>
      {events?.some(event => event.unread) && <button className={button} onClick={onRead}>Marcar como leídas</button>}
    </div>
    {!events && <p role="status">Cargando notificaciones…</p>}
    {events?.length === 0 && <div className="community-empty"><Bell size={24} /><p>No hay actividad reciente.</p></div>}
    {events?.map(event => <button key={`${event.kind}:${event.user_id}:${event.target}:${event.occurred_at}`}
      className="community-thread" onClick={() => onOpen(event)}>
      <Avatar person={event} />
      <span className="min-w-0 flex-1 text-sm">
        <span className="font-semibold">{event.display_name}</span> {descriptions[event.kind]}
        <span className="block text-xs text-[var(--sub)]">{dateLabel(event.occurred_at)}</span>
      </span>
      {event.unread && <span className="community-count" aria-label="Sin leer">•</span>}
    </button>)}
  </section>;
}
