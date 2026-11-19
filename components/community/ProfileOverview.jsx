"use client";

import { useEffect, useState } from "react";
import { Film, Grid3X3, Pencil, Repeat2, Share2 } from "lucide-react";
import { communityRequest } from "./api";
import Feed from "./Feed";
import { Avatar, button, card, Notice } from "./controls";

const tabs = [
  { scope: "mine", label: "Publicaciones", Icon: Grid3X3 },
  { scope: "mine-video", label: "Videos", Icon: Film },
  { scope: "reposts", label: "Republicaciones", Icon: Repeat2 },
];

export default function ProfileOverview({ profile, revision, onEdit, onPeople, onCompose, onPost }) {
  const [scope, setScope] = useState("mine");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    communityRequest("profile?summary=1", { signal: controller.signal })
      .then(data => setStats(data.stats)).catch(failure => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [profile.user_id, revision]);

  async function share() {
    const url = new URL("/", window.location.origin);
    url.searchParams.set("persona", profile.handle);
    setError("");
    setNotice("");
    try {
      if (navigator.share) await navigator.share({ title: `@${profile.handle} en NutriCoach`, url: url.href });
      else {
        await navigator.clipboard.writeText(url.href);
        setNotice("Enlace del perfil copiado.");
      }
    } catch (failure) {
      if (failure.name !== "AbortError") setError("No se pudo compartir el perfil.");
    }
  }

  return <section className="grid min-w-0 gap-3" aria-label="Mi perfil">
    <div className={`${card} community-profile-hero`}>
      <div className="community-profile-identity">
        <Avatar person={profile} large />
        <div className="min-w-0">
          <p className="truncate text-sm text-[var(--sub)]">@{profile.handle}</p>
          <h2 className="break-words text-xl font-semibold">{profile.display_name}</h2>
        </div>
      </div>
      {profile.bio && <p className="whitespace-pre-wrap break-words text-sm">{profile.bio}</p>}
      <div className="community-profile-stats" aria-label="Estadísticas del perfil">
        <button type="button" onClick={() => setScope("mine")}><strong>{stats?.posts ?? "—"}</strong><span>Publicaciones</span></button>
        <button type="button" onClick={onPeople}><strong>{stats?.friends ?? "—"}</strong><span>Amistades</span></button>
        <button type="button" onClick={() => setScope("reposts")}><strong>{stats?.reposts ?? "—"}</strong><span>Republicaciones</span></button>
      </div>
      <div className="community-profile-buttons">
        <button className={button} onClick={onEdit}><Pencil size={16} aria-hidden="true" /> Editar perfil</button>
        <button className={button} onClick={share}><Share2 size={16} aria-hidden="true" /> Compartir perfil</button>
      </div>
      <Notice error={error} />
      {notice && <p role="status" className="text-sm">{notice}</p>}
    </div>
    <nav className="community-profile-tabs" aria-label="Contenido del perfil">
      {tabs.map(({ scope: key, label, Icon }) => <button key={key} type="button" aria-pressed={scope === key}
        onClick={() => setScope(key)}><Icon size={19} aria-hidden="true" /><span>{label}</span></button>)}
    </nav>
    <Feed key={scope} profile={profile} scope={scope} revision={revision} onCompose={onCompose} onOpenPost={onPost} />
  </section>;
}
