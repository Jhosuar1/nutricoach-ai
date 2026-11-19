"use client";

import { useState } from "react";
import { sendJson } from "./api";
import { button, card, field, Notice, primary } from "./controls";

export default function Profile({ profile, suggestedName, onSave, onCancel }) {
  const [name, setName] = useState(profile?.display_name ?? suggestedName?.slice(0, 50) ?? "");
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await sendJson("profile", { handle, name, bio }, "PUT");
      onSave(result.profile);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={save} className={`${card} grid gap-3`}>
    <h2 className="font-semibold">{profile ? "Editar perfil social" : "Crea tu perfil social"}</h2>
    <p className="text-sm text-[var(--sub)]">Tu correo y tus registros son privados. El nombre, el usuario y la biografía se pueden encontrar en Comunidad.</p>
    <label className="grid gap-1 text-sm">Nombre
      <input className={field} value={name} onChange={e => setName(e.target.value)} required maxLength={50} />
    </label>
    <label className="grid gap-1 text-sm">Usuario
      <input className={field} value={handle} onChange={e => setHandle(e.target.value)} autoCapitalize="none" autoComplete="off" spellCheck={false} required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" placeholder="por_ejemplo" />
    </label>
    <label className="grid gap-1 text-sm">Biografía
      <textarea className={field} value={bio} onChange={e => setBio(e.target.value)} maxLength={240} rows={2} />
    </label>
    <Notice error={error} />
    <div className="flex flex-wrap gap-2">
      <button className={primary} disabled={pending}>{pending ? "Guardando…" : "Guardar perfil"}</button>
      {profile && <button type="button" className={button} onClick={onCancel}>Cancelar</button>}
    </div>
  </form>;
}
