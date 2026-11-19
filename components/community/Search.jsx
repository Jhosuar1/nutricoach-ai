"use client";

import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import Feed from "./Feed";
import People from "./People";
import { button, card, field, primary } from "./controls";

export default function Search({ profile, onChat }) {
  const [entry, setEntry] = useState("");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("people");

  return <section className="grid min-w-0 gap-4" aria-label="Buscar en Comunidad">
    <form className={`${card} grid gap-3`} onSubmit={event => { event.preventDefault(); setQuery(entry.trim()); }}>
      <label className="grid gap-2 text-sm font-semibold">Buscar en Comunidad
        <span className="relative">
          <SearchIcon size={18} className="absolute left-3 top-3 text-[var(--sub)]" aria-hidden="true" />
          <input type="search" className={field + " !pl-10"} value={entry} onChange={event => {
            setEntry(event.target.value);
            if (!event.target.value) setQuery("");
          }} maxLength={50} placeholder="Personas, @usuarios o publicaciones" />
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} aria-pressed={scope === "people"} onClick={() => setScope("people")}>Personas</button>
        <button type="button" className={button} aria-pressed={scope === "posts"} onClick={() => setScope("posts")}>Publicaciones</button>
        <button className={primary + " ml-auto"} disabled={!entry.trim()}>Buscar</button>
      </div>
    </form>
    {query ? scope === "people" ? <People searchQuery={query} onChat={onChat} /> : <Feed profile={profile} query={query} />
      : <div className="community-empty"><div className="community-empty-icon"><SearchIcon aria-hidden="true" size={24} /></div>
        <p className="font-semibold">¿Qué estás buscando?</p><p className="text-sm text-[var(--sub)]">Escribe un nombre, un @usuario o una palabra de la publicación.</p>
      </div>}
  </section>;
}
