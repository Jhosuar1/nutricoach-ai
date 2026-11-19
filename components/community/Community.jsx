"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Bell, Bookmark, Film, Gamepad2, ImagePlus, LayoutList, LockKeyhole, MessageCircle, Plus, Search as SearchIcon, SquarePen, UserRound, Users } from "lucide-react";
import Profile from "./Profile";
import ProfileOverview from "./ProfileOverview";
import ActionPanel from "./ActionPanel";
import Feed from "./Feed";
import People from "./People";
import Inbox from "./Inbox";
import Search from "./Search";
import Composer from "./Composer";
import Activity from "./Activity";
import Games from "./games/Games";
import VideoCall from "./VideoCall";
import { communityRequest, sendJson } from "./api";
import { Avatar, button, Notice, primary } from "./controls";
import "./community.css";

const views = [
  { id: "feed", label: "Publicaciones", mobile: "Muro", Icon: LayoutList },
  { id: "search", label: "Buscar", Icon: SearchIcon },
  { id: "video", label: "Videos", Icon: Film },
  { id: "people", label: "Amistades", Icon: Users },
  { id: "inbox", label: "Mensajes", Icon: MessageCircle },
  { id: "games", label: "Juegos", Icon: Gamepad2 },
  { id: "saved", label: "Guardados", Icon: Bookmark },
];

export default function Community({ suggestedName, sharedPost, sharedPerson, onClearSharedPost, messageSignals, messagePeer, onMessageOpened, onActivePeer }) {
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState(sharedPerson ? "search" : "feed");
  const [peer, setPeer] = useState(null);
  const [composer, setComposer] = useState(null);
  const [published, setPublished] = useState(0);
  const [editing, setEditing] = useState(false);
  const [events, setEvents] = useState(null);
  const [activityError, setActivityError] = useState("");
  const [incoming, setIncoming] = useState(null);
  const [call, setCall] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postOrigin, setPostOrigin] = useState("feed");
  const uid = profile?.user_id;
  const postId = sharedPost || selectedPost;
  const unread = events?.filter(event => event.unread).length || 0;

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

  useEffect(() => {
    if (!uid) return;
    const controller = new AbortController();
    let timer;
    let count = 0;
    async function poll() {
      if (!document.hidden) {
        const options = { signal: controller.signal };
        const requests = [communityRequest("calls", options).then(data => {
          if (!controller.signal.aborted) setIncoming(data.incoming);
        })];
        if (count++ % 3 === 0) requests.push(communityRequest("activity", options).then(data => {
          if (!controller.signal.aborted) { setEvents(data.events); setActivityError(""); }
        }).catch(failure => {
          if (!controller.signal.aborted) setActivityError(failure.message);
        }));
        await Promise.allSettled(requests);
      }
      if (!controller.signal.aborted) timer = setTimeout(poll, 4500);
    }
    poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [uid]);

  const activePeer = view === "inbox" && uid ? peer?.user_id : null;
  useEffect(() => {
    onActivePeer?.(activePeer ?? null);
    return () => onActivePeer?.(null);
  }, [activePeer, onActivePeer]);

  useEffect(() => {
    if (!messagePeer || !uid) return;
    setSelectedPost(null);
    setPeer(messagePeer);
    setView("inbox");
    onMessageOpened?.();
  }, [messagePeer, uid, onMessageOpened]);

  async function markRead() {
    if (!events?.[0]) return;
    const at = events[0].read_cursor;
    try {
      await sendJson("activity", { at });
      setEvents(items => items?.map(event => Date.parse(event.occurred_at) <= Date.parse(at) ? { ...event, unread: false } : event));
    } catch (failure) {
      setActivityError(failure.message);
    }
  }

  function openEvent(event) {
    if (event.kind === "message") openChat(event);
    else if (["friend", "accepted"].includes(event.kind)) setView("people");
    else {
      onClearSharedPost?.();
      setPostOrigin("activity");
      setSelectedPost(event.target);
      setView("feed");
    }
  }

  async function dismissIncoming() {
    const invitation = incoming;
    setIncoming(null);
    try {
      await sendJson("calls", { action: "end", id: invitation.id });
    } catch (failure) {
      setActivityError(failure.message);
    }
  }

  function openChat(person) {
    onClearSharedPost?.();
    setSelectedPost(null);
    setPeer(person);
    setView("inbox");
  }

  return <main className="community-root">
    <header className="community-heading">
      <div className="min-w-0">
        <h1>Comunidad</h1>
      </div>
      {profile && <div className="flex flex-wrap gap-2">
        <button className={button} aria-label={unread ? `Notificaciones: ${unread} sin leer` : "Notificaciones"} onClick={() => {
          onClearSharedPost?.(); setSelectedPost(null); setView("activity");
        }}><Bell size={18} aria-hidden="true" />{unread > 0 && <span className="community-count">{unread}</span>}</button>
        <ActionPanel title="Crear contenido" label="Crear" Icon={Plus} className={primary} items={[
          { Icon: SquarePen, label: "Publicación", action: () => setComposer("post") },
          { Icon: ImagePlus, label: "Fotos", action: () => setComposer("photo") },
          { Icon: Film, label: "Video", action: () => setComposer("video") },
        ]} />
      </div>}
    </header>
    <Notice error={error} onRetry={() => setRevision(value => value + 1)} />
    {profile === undefined && !error && <p role="status" className="community-empty">Cargando Comunidad…</p>}
    {profile === null && <div className="mx-auto w-full max-w-lg"><Profile suggestedName={suggestedName}
      onSave={saved => { setProfile(saved); setView("feed"); }} /></div>}
    {incoming && !call && <div className="community-card flex flex-wrap items-center gap-2" role="status">
      <p className="mr-auto font-semibold">{incoming.display_name} te está llamando</p>
      <button className={button} onClick={dismissIncoming}>Rechazar</button>
      <button className={primary} onClick={() => setCall({ id: incoming.id, name: incoming.display_name })}>Contestar</button>
    </div>}
    {profile && <div className="community-layout">
      <nav className="community-nav" aria-label="Secciones de Comunidad">
        {views.map(({ id, label, mobile, Icon }) => <button key={id} type="button" aria-current={view === id ? "page" : undefined}
          className="community-nav-item" onClick={() => { onClearSharedPost?.(); setSelectedPost(null); setView(id); if (id === "inbox") setPeer(null); }}>
          <Icon size={19} aria-hidden="true" />{mobile ? <><span className="community-desktop-label">{label}</span><span className="community-mobile-label">{mobile}</span></> : <span>{label}</span>}
        </button>)}
        <button className="community-nav-item" aria-current={view === "profile" ? "page" : undefined} onClick={() => { onClearSharedPost?.(); setSelectedPost(null); setEditing(false); setView("profile"); }}>
          <UserRound size={19} aria-hidden="true" /> <span>Mi perfil</span>
        </button>
      </nav>
      <div className="community-main">
        {postId && view === "feed" && <>
          <div className="community-section-heading"><h2>{sharedPost ? "Publicación compartida" : "Publicación"}</h2><button className={button} onClick={() => {
            onClearSharedPost?.(); setSelectedPost(null); setView(sharedPost ? "feed" : postOrigin);
          }}>Volver</button></div>
          <Feed profile={profile} postId={postId} />
        </>}
        {view === "activity" && <><Notice error={activityError} /><Activity events={events} onOpen={openEvent} onRead={markRead} /></>}
        {view === "feed" && !postId && <>
          <div className="community-section-heading"><h2>Publicaciones</h2><span>Recientes</span></div>
          <Feed profile={profile} revision={published} onCompose={setComposer} />
        </>}
        {view === "video" && <>
          <div className="community-section-heading"><h2>Videos</h2><button className={button} onClick={() => setComposer("video")}><Plus aria-hidden="true" size={16} /> Añadir video</button></div>
          <Feed profile={profile} scope="video" revision={published} onCompose={setComposer} />
        </>}
        {view === "games" && <Games userId={uid} />}
        {view === "saved" && <>
          <div className="community-section-heading"><h2>Guardados</h2></div>
          <Feed profile={profile} scope="saved" />
        </>}
        {view === "search" && <Search profile={profile} onChat={openChat} initialQuery={sharedPerson ? `@${sharedPerson}` : ""} />}
        {view === "people" && <>
          <div className="community-section-heading"><h2>Amistades</h2><button className={button} onClick={() => setView("search")}><SearchIcon aria-hidden="true" size={16} /> Buscar</button></div>
          <People onChat={openChat} />
        </>}
        {view === "inbox" && <Inbox peer={peer} userId={profile.user_id} messageRevision={messageSignals?.revision} messageVersion={messageSignals?.versions?.[peer?.user_id]} onSelect={setPeer} onFind={() => setView("search")}
          onCall={person => setCall({ userId: person.user_id, name: person.display_name })} />}
        {view === "profile" && (editing ? <Profile profile={profile} suggestedName={suggestedName}
          onCancel={() => setEditing(false)} onSave={saved => { setProfile(saved); setEditing(false); }} /> :
          <ProfileOverview profile={profile} revision={published} onEdit={() => setEditing(true)} onPeople={() => setView("people")}
            onCompose={setComposer} onPost={id => {
              setPostOrigin("profile"); setSelectedPost(id); setView("feed");
            }} />)}
      </div>
      <aside className="community-aside" aria-label="Perfil y privacidad">
        <button className="community-card community-profile-link" onClick={() => { onClearSharedPost?.(); setSelectedPost(null); setEditing(false); setView("profile"); }}>
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
    {call && <VideoCall invitation={call} onClose={() => {
      if (call.id) sendJson("calls", { action: "end", id: call.id }).catch(() => {});
      setIncoming(null); setCall(null);
    }} />}
    {composer && <Composer profile={profile} mode={composer} onClose={() => setComposer(null)} onPublished={() => {
      setComposer(null);
      onClearSharedPost?.();
      setSelectedPost(null);
      setView(current => current === "profile" ? "profile" : composer === "video" ? "video" : "feed");
      setPublished(value => value + 1);
    }} />}
  </main>;
}
