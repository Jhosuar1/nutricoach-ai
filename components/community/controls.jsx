export const card = "community-card";
export const field = "community-input";
export const button = "community-button";
export const primary = "community-button community-primary";

export function Notice({ error, onRetry }) {
  if (!error) return null;
  return <p role="alert" className="rounded-xl border border-amber-500 p-3 text-sm">
    {error}{onRetry && <button className="ml-2 underline" onClick={onRetry}>Reintentar</button>}
  </p>;
}

const time = new Intl.DateTimeFormat("es", { hour: "numeric", minute: "2-digit" });
const date = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });

export function dateLabel(value) {
  const at = new Date(value);
  return at.toDateString() === new Date().toDateString() ? time.format(at) : date.format(at);
}

export function Avatar({ person, small = false, large = false }) {
  const initials = (person.display_name || person.handle || "N").trim()
    .split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase();
  const colorIndex = Array.from(person.handle || initials).reduce((n, part) => n + part.codePointAt(0), 0) % 4;
  return <span className={`community-avatar tone-${colorIndex} ${small ? "is-small" : large ? "is-large" : ""}`} aria-hidden="true">{initials}</span>;
}

export function Person({ person }) {
  return <div className="min-w-0 break-words">
    <p className="font-semibold">{person.display_name}</p>
    <p className="text-sm text-[var(--sub)]">@{person.handle}</p>
    {person.bio && <p className="mt-1 whitespace-pre-wrap text-sm">{person.bio}</p>}
  </div>;
}
