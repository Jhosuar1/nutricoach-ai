export const card = "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4";
export const field = "w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-base";
export const button = "min-h-11 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold disabled:opacity-50";
export const primary = "min-h-11 rounded-xl bg-[#6655de] px-3 text-sm font-semibold text-white disabled:opacity-50";

export function Notice({ error, onRetry }) {
  if (!error) return null;
  return <p role="alert" className="rounded-xl border border-amber-500 p-3 text-sm">
    {error}{onRetry && <button className="ml-2 underline" onClick={onRetry}>Reintentar</button>}
  </p>;
}

export function Person({ person }) {
  return <div className="min-w-0 break-words">
    <p className="font-semibold">{person.display_name}</p>
    <p className="text-sm text-[var(--sub)]">@{person.handle}</p>
    {person.bio && <p className="mt-1 whitespace-pre-wrap text-sm">{person.bio}</p>}
  </div>;
}
