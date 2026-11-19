"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Bookmark, Film, LayoutList, LockKeyhole, MessageCircle, Plus, Search as SearchIcon, UserRound, Users } from "lucide-react";
import Profile from "./Profile";
import Feed from "./Feed";
import People from "./People";
import Inbox from "./Inbox";
import Search from "./Search";
import Composer from "./Composer";
import { communityRequest } from "./api";
import { Avatar, button, Notice, Person, primary } from "./controls";
import "./community.css";

const views = [
  { id: "feed", label: "Publicaciones", mobile: "Muro", Icon: LayoutList },
  { id: "search", label: "Buscar", Icon: SearchIcon },
  { id: "video", label: "Videos", Icon: Film },
  { id: "people", label: "Amistades", Icon: Users },
  { id: "inbox", label: "Mensajes", Icon: MessageCircle },
  { id: "saved", label: "Guardados", Icon: Bookmark },
];

export default function Community({ suggestedName }) {
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState("feed");
  const [peer, setPeer] = useState(null);
  const [composer, setComposer] = useState(null);
  const [published, setPublished] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    communityRequest("profile", { signal: controller.signal })
      .then(data => setProfile(data.profile))
      .catch(failure => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [revision]);

  function openChat(person) {
    setPeer(person);
    setView("inbox");
  }

  return <main className="community-root">
    <header className="community-heading">
      <div className="min-w-0">
        <h1>Comunidad</h1>
      </div>
      {profile && <button className={primary} onClick={() => setComposer("post")}><Plus aria-hidden="true" size={18} /><span>Crear publicación</span></button>}
    </header>
    <Notice error={error} onRetry={() => setRevision(value => value + 1)} />
    {profile === undefined && !error && <p role="status" className="community-empty">Cargando Comunidad…</p>}
    {profile === null && <div className="mx-auto w-full max-w-lg"><Profile suggestedName={suggestedName}
      onSave={saved => { setProfile(saved); setView("feed"); }} /></div>}
    {profile && <div className="community-layout">
      <nav className="community-nav" aria-label="Secciones de Comunidad">
        {views.map(({ id, label, mobile, Icon }) => <button key={id} type="button" aria-current={view === id ? "page" : undefined}
          className="community-nav-item" onClick={() => { setView(id); if (id === "inbox") setPeer(null); }}>
          <Icon size={19} aria-hidden="true" />{mobile ? <><span className="community-desktop-label">{label}</span><span className="community-mobile-label">{mobile}</span></> : <span>{label}</span>}
        </button>)}
        <button className="community-nav-item" aria-current={view === "profile" ? "page" : undefined} onClick={() => { setEditing(false); setView("profile"); }}>
          <UserRound size={19} aria-hidden="true" /> <span>Mi perfil</span>
        </button>
      </nav>
      <div className="community-main">
        {view === "feed" && <>
          <div className="community-section-heading"><h2>Publicaciones</h2><span>Recientes</span></div>
          <Feed profile={profile} revision={published} onCompose={setComposer} />
        </>}
        {view === "video" && <>
          <div className="community-section-heading"><h2>Videos</h2><button className={button} onClick={() => setComposer("video")}><Plus aria-hidden="true" size={16} /> Añadir video</button></div>
          <Feed profile={profile} scope="video" revision={published} onCompose={setComposer} />
        </>}
        {view === "saved" && <>
          <div className="community-section-heading"><h2>Guardados</h2></div>
          <Feed profile={profile} scope="saved" />
        </>}
        {view === "search" && <Search profile={profile} onChat={openChat} />}
        {view === "people" && <>
          <div className="community-section-heading"><h2>Amistades</h2><button className={button} onClick={() => setView("search")}><SearchIcon aria-hidden="true" size={16} /> Buscar</button></div>
          <People onChat={openChat} />
        </>}
        {view === "inbox" && <Inbox peer={peer} userId={profile.user_id} onSelect={setPeer} onFind={() => setView("people")} />}
        {view === "profile" && (editing ? <Profile profile={profile} suggestedName={suggestedName}
          onCancel={() => setEditing(false)} onSave={saved => { setProfile(saved); setEditing(false); }} /> : <>
          <div className="community-card flex flex-wrap items-center gap-3">
            <Avatar person={profile} /><div className="min-w-0 flex-1"><Person person={profile} /></div>
            <button className={button} onClick={() => setEditing(true)}>Editar perfil</button>
          </div>
          <div className="community-section-heading"><h2>Mis publicaciones</h2></div>
          <Feed profile={profile} scope="mine" revision={published} onCompose={setComposer} />
        </>)}
      </div>
      <aside className="community-aside" aria-label="Perfil y privacidad">
        <button className="community-card community-profile-link" onClick={() => { setEditing(false); setView("profile"); }}>
          <Avatar person={profile} />
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold">{profile.display_name}</span>
            <span className="block truncate text-xs text-[var(--sub)]">@{profile.handle}</span>
          </span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>
        <div className="community-card grid gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole aria-hidden="true" size={16} /> Tu privacidad</h2>
          <p className="text-sm leading-relaxed text-[var(--sub)]">Tus publicaciones son para amistades. Tus registros de salud y tu correo siguen siendo privados.</p>
        </div>
      </aside>
    </div>}
    {composer && <Composer profile={profile} mode={composer} onClose={() => setComposer(null)} onPublished={() => {
      setComposer(null);
      setView(composer === "video" ? "video" : "feed");
      setPublished(value => value + 1);
    }} />}
  </main>;
}
