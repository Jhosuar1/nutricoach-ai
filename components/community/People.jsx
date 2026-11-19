"use client";

import { useEffect, useState } from "react";
import { communityRequest, sendJson } from "./api";
import { button, card, field, Notice, Person, Avatar, primary } from "./controls";

export default function People({ onChat, searchQuery = null }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);

  const effectiveQuery = searchQuery ?? query;

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setResult(null);
    communityRequest(effectiveQuery ? `friends?q=${encodeURIComponent(effectiveQuery)}` : "friends", { signal: controller.signal })
      .then(setResult).catch(failure => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [effectiveQuery, revision]);

  async function change(other, action) {
    if (busy) return;
    if (action === "block" && !window.confirm("¿Bloquear este perfil? Se eliminará la amistad y se desactivará el chat.")) return;
    setBusy(true);
    setError("");
    try {
      await sendJson("friends", { other, action });
      setRevision(value => value + 1);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  const secondary = { sent: "Cancelar solicitud", received: "Rechazar", friend: "Quitar amistad" };

  return <div className="grid gap-3">
    {searchQuery === null && <form className={`${card} grid gap-2`} onSubmit={event => {
      event.preventDefault();
      const next = search.trim();
      if (next === query) setRevision(value => value + 1);
      else setQuery(next);
    }}>
      <label className="grid gap-1 text-sm">Buscar por nombre o usuario
        <input className={field} value={search} onChange={e => setSearch(e.target.value)} maxLength={50} autoCapitalize="none" placeholder="Nombre o @usuario" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className={primary}>Buscar</button>
        {query && <button type="button" className={button} onClick={() => { setSearch(""); setQuery(""); }}>Ver mis contactos</button>}
      </div>
    </form>}
    <Notice error={error} onRetry={() => setRevision(value => value + 1)} />
    {!result && !error && <p role="status">Cargando perfiles…</p>}
    {result?.people.length === 0 && <p className="text-sm text-[var(--sub)]">{effectiveQuery ? "No se encontraron perfiles." : "Aún no tienes contactos ni solicitudes. Busca a alguien por su @usuario."}</p>}
    {result?.people.map(person => {
      const id = person.user_id;
      return <article key={id} className={`${card} grid gap-3`}>
        <div className="flex items-start gap-3"><Avatar person={person} /><Person person={person} /></div>
        {person.relationship === "sent" && <p className="text-sm">Solicitud enviada</p>}
        {person.relationship === "received" && <p className="text-sm">Solicitud recibida</p>}
        <div className="flex flex-wrap gap-2">
          {person.relationship === "none" && <button className={primary} disabled={busy} onClick={() => change(id, "request")}>Agregar amistad</button>}
          {person.relationship === "received" && <button className={primary} disabled={busy} onClick={() => change(id, "accept")}>Aceptar</button>}
          {person.relationship === "friend" && <button className={primary} onClick={() => onChat(person)}>Enviar mensaje</button>}
          {secondary[person.relationship] && <button className={button} disabled={busy} onClick={() => change(id, "remove")}>{secondary[person.relationship]}</button>}
          <button className={button} disabled={busy} onClick={() => change(id, "block")}>Bloquear</button>
        </div>
      </article>;
    })}
    {result?.blocked.length > 0 && <section className={`${card} grid gap-3`}>
      <h2 className="font-semibold">Perfiles bloqueados</h2>
      {result.blocked.map(person => <div className="flex items-center justify-between gap-2" key={person.user_id}>
        <Person person={person} />
        <button className={button} disabled={busy} onClick={() => change(person.user_id, "unblock")}>Desbloquear</button>
      </div>)}
    </section>}
  </div>;
}
