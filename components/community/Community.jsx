"use client";

import { useEffect, useState } from "react";
import Profile from "./Profile";
import Feed from "./Feed";
import People from "./People";
import Chat from "./Chat";
import { communityRequest } from "./api";
import { button, Notice } from "./controls";

export default function Community({ suggestedName }) {
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState("feed");
  const [peer, setPeer] = useState(null);

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

  return <main className="grid gap-4 px-5 pb-6 pt-3 text-[var(--text)]">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-2xl font-semibold">Comunidad</h1>
      {profile && <button className={button} onClick={() => setView("profile")}>Mi perfil</button>}
    </div>
    <Notice error={error} onRetry={() => setRevision(value => value + 1)} />
    {profile === undefined && !error && <p role="status">Cargando Comunidad…</p>}
    {(profile === null || view === "profile") && <Profile
      profile={profile}
      suggestedName={suggestedName}
      onCancel={() => setView("feed")}
      onSave={saved => { setProfile(saved); setView("feed"); }}
    />}
    {profile && view !== "profile" && <>
      <nav className="flex flex-wrap gap-2" aria-label="Comunidad">
        <button className={button} aria-pressed={view === "feed"} onClick={() => setView("feed")}>Publicaciones</button>
        <button className={button} aria-pressed={view === "people"} onClick={() => setView("people")}>Amistades</button>
        {peer && <button className={button} aria-pressed={view === "chat"} onClick={() => setView("chat")}>Conversación</button>}
      </nav>
      {view === "feed" && <Feed userId={profile.user_id} />}
      {view === "people" && <People onChat={person => { setPeer(person); setView("chat"); }} />}
      {view === "chat" && peer && <Chat key={peer.user_id} peer={peer} userId={profile.user_id} onBack={() => setView("people")} />}
    </>}
  </main>;
}
