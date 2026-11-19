"use client";

import dynamic from "next/dynamic";
import { useMessageSignals } from "@/components/community/useMessageSignals";
import { InstallAppButton } from "@/components/InstallApp";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Home, Camera, Dumbbell, TrendingUp, Moon, Sun, LogOut, CalendarDays, Users, MessageCircle, X, Settings as SettingsIcon } from "lucide-react";
import { AuthScreen, Onboarding, Dashboard, ScanMeal, Workouts, Progress, History, Settings } from "@/components/Screens";
import { calcProfile, T } from "@/lib/nutrition";
import { computeAppDate } from "@/lib/appDate";

const Community = dynamic(() => import("@/components/community/Community"), {
  loading: () => <p className="p-6 text-[var(--text)]" role="status">Cargando Comunidad…</p>,
});

async function fetchDashboardData(url, signal) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(cancel, 12000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("No se pudieron cargar los datos");
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const [nutrition, setNutrition] = useState(null);
  const [streakError, setStreakError] = useState(false);
  const [dashboardRetry, setDashboardRetry] = useState(0);
  const [details, setDetails] = useState(null);
  const [detailRetry, setDetailRetry] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);
  const [screen, setScreen] = useState("dashboard");
  const [messagePeer, setMessagePeer] = useState(null);
  const [activePeer, setActivePeer] = useState(null);
  const [sharedPost, setSharedPost] = useState(null);
  const [sharedPerson, setSharedPerson] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dark, setDark] = useState(true);
  const [meals, setMeals] = useState([]);
  const [water, setWater] = useState(0);
  const [weightLog, setWeightLog] = useState([]);
  const [done, setDone] = useState([]);
  const [streak, setStreak] = useState(0);
  const [appDate, setAppDate] = useState(() => computeAppDate(new Date(), "07:00"));

  const userId = profile?.user_id;
  const messageSignals = useMessageSignals(userId, activePeer);
  const dashboardKey = userId && `${userId}:${appDate}`;
  const currentNutrition = nutrition?.key === dashboardKey ? nutrition : null;
  const detailKey = userId && (screen === "progress" ? `${userId}:weight` :
    screen === "workouts" ? `${dashboardKey}:workouts` : null);
  const currentDetails = details?.key === detailKey ? details : null;

  useEffect(() => {
    if (!userId) return;
    const url = new URL(window.location.href);
    const post = url.searchParams.get("post");
    const person = url.searchParams.get("persona");
    const validPost = post && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(post);
    const validPerson = person && /^[a-z0-9_]{3,24}$/.test(person);
    if (!validPost && !validPerson) return;
    setSharedPost(validPost ? post : null);
    setSharedPerson(!validPost && validPerson ? person : null);
    setScreen("community");
    url.searchParams.delete("post");
    url.searchParams.delete("persona");
    window.history.replaceState(window.history.state, "", url);
  }, [userId]);

  const targets = useMemo(() => (profile ? calcProfile(profile) : null), [profile]);

  // Recalcula el "día" cada minuto; si cambió (llegó la hora de levantarse), refresca todo.
  useEffect(() => {
    const t = setInterval(() => {
      if (!profile) return;
      const fresh = computeAppDate(new Date(), profile.wake_time);
      setAppDate((prev) => (prev !== fresh ? fresh : prev));
    }, 60000);
    return () => clearInterval(t);
  }, [profile]);

  useEffect(() => {
    if (profile) setAppDate(computeAppDate(new Date(), profile.wake_time));
  }, [profile?.wake_time]);

  const loadMeals = useCallback(async (date, signal) => {
    const d = await fetchDashboardData(`/api/meals?date=${date}`, signal);
    if (signal?.aborted) return;
    setMeals(d.meals || []);
  }, []);
  const loadWater = useCallback(async (date, signal) => {
    const d = await fetchDashboardData(`/api/water?date=${date}`, signal);
    if (signal?.aborted) return;
    setWater(d.total_ml || 0);
  }, []);
  const loadWeight = useCallback(async (signal) => {
    const d = await fetchDashboardData("/api/weight", signal);
    if (signal?.aborted) return;
    setWeightLog(d.logs || []);
  }, []);
  const loadWorkouts = useCallback(async (date, signal) => {
    const d = await fetchDashboardData(`/api/workouts?date=${date}`, signal);
    if (signal?.aborted) return;
    setDone(d.completed || []);
  }, []);
  const loadStreak = useCallback(async (date, signal) => {
    const d = await fetchDashboardData(`/api/streak?today=${date}`, signal);
    if (signal?.aborted) return;
    setStreak(d.streak || 0);
  }, []);

  useEffect(() => {
    if (!dashboardKey) return;
    const controller = new AbortController();
    const { signal } = controller;
    setStreakError(false);
    Promise.allSettled([loadMeals(appDate, signal), loadWater(appDate, signal)]).then((results) => {
      if (!signal.aborted) {
        setNutrition({ key: dashboardKey, error: results.some((result) => result.status === "rejected") });
      }
    });
    loadStreak(appDate, signal).catch(() => {
      if (!signal.aborted) setStreakError(true);
    });
    return () => controller.abort();
  }, [appDate, dashboardKey, dashboardRetry, loadMeals, loadStreak, loadWater]);

  useEffect(() => {
    if (!detailKey || showSettings) return;
    const controller = new AbortController();
    const { signal } = controller;
    const request = screen === "progress" ? loadWeight(signal) : loadWorkouts(appDate, signal);
    request.then(() => {
      if (!signal.aborted) setDetails({ key: detailKey, error: false });
    }).catch(() => {
      if (!signal.aborted) setDetails({ key: detailKey, error: true });
    });
    return () => controller.abort();
  }, [appDate, detailKey, detailRetry, loadWeight, loadWorkouts, screen, showSettings]);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setSessionError(false);
    try {
      const p = await fetchDashboardData("/api/profile");
      if (typeof p.authenticated !== "boolean") throw new Error("Respuesta de perfil inválida");
      setAuthenticated(p.authenticated);
      setProfile(p.profile || null);
      if (p.authenticated && p.profile) {
        const date = computeAppDate(new Date(), p.profile.wake_time);
        setAppDate(date);
      }
    } catch {
      setSessionError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshSession(); }, [refreshSession]);

  async function handleOnboardingComplete(p) {
    const res = await fetch("/api/profile", { method: "POST", body: JSON.stringify(p) }).then((r) => r.json());
    const date = computeAppDate(new Date(), p.wakeTime);
    await fetch("/api/weight", { method: "POST", body: JSON.stringify({ weight: p.weight, app_date: date }) });
    setAppDate(date);
    setProfile(res.profile);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMessagePeer(null);
    setActivePeer(null);
    setAuthenticated(false);
    setProfile(null);
    setNutrition(null);
    setDetails(null);
    setStreak(0);
    setWeightLog([]);
    setDone([]);
    setScreen("dashboard");
  }

  async function addMeal(meal) {
    await fetch("/api/meals", { method: "POST", body: JSON.stringify({ ...meal, app_date: appDate }) });
    await loadMeals(appDate);
    await loadStreak(appDate);
    setScreen("dashboard");
  }
  async function deleteMeal(id) {
    await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    await loadMeals(appDate);
  }
  async function addWater() {
    await fetch("/api/water", { method: "POST", body: JSON.stringify({ amount_ml: 250, app_date: appDate }) });
    await loadWater(appDate);
    await loadStreak(appDate);
  }
  async function addWeight(w) {
    await fetch("/api/weight", { method: "POST", body: JSON.stringify({ weight: w, app_date: appDate }) });
    await loadWeight();
    setProfile((p) => ({ ...p, weight: w }));
  }
  async function updateHeight(h) {
    const merged = {
      name: profile.name, sex: profile.sex, age: profile.age,
      height: h, weight: profile.weight, targetWeight: profile.target_weight,
      activity: profile.activity, goal: profile.goal, place: profile.place,
      trainDays: profile.train_days, equipment: profile.equipment, wakeTime: profile.wake_time,
    };
    const res = await fetch("/api/profile", { method: "POST", body: JSON.stringify(merged) }).then((r) => r.json());
    setProfile(res.profile);
  }
  async function saveSettings(patch) {
    const merged = {
      name: patch.name, sex: profile.sex, age: patch.age,
      height: patch.height, weight: profile.weight, targetWeight: patch.targetWeight,
      activity: patch.activity, goal: patch.goal, place: patch.place,
      trainDays: patch.trainDays, equipment: patch.equipment, wakeTime: patch.wakeTime,
    };
    const res = await fetch("/api/profile", { method: "POST", body: JSON.stringify(merged) }).then((r) => r.json());
    setProfile(res.profile);
  }
  async function toggleExercise(key) {
    await fetch("/api/workouts", { method: "POST", body: JSON.stringify({ exercise_key: key, app_date: appDate }) });
    await loadWorkouts(appDate);
    await loadStreak(appDate);
  }

  const vars = {
    "--bg": dark ? T.bgDark : T.bgLight,
    "--card": dark ? T.cardDark : T.cardLight,
    "--border": dark ? T.borderDark : T.borderLight,
    "--text": dark ? T.textDark : T.textLight,
    "--sub": dark ? T.subDark : T.subLight,
  };

  if (sessionError) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6 text-center text-white">
        <p role="alert">No pudimos cargar tu cuenta. Revisa tu conexión e inténtalo de nuevo.</p>
        <button className="rounded-lg bg-violet-700 px-5 py-3" onClick={refreshSession}>Reintentar</button>
      </main>
    );
  }

  if (loading) {
    return (
      <div style={{ ...vars, backgroundColor: "var(--bg)", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)" }}>
        Cargando…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ ...vars, backgroundColor: "var(--bg)", minHeight: "100dvh" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh" }}>
          <AuthScreen onAuthed={refreshSession} installAction={<InstallAppButton />} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ ...vars, backgroundColor: "var(--bg)", minHeight: "100dvh" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh" }}>
          <div className="flex justify-end px-6 pt-4"><InstallAppButton /></div>
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", icon: Home, label: "Inicio" },
    { id: "scan", icon: Camera, label: "Escanear" },
    { id: "workouts", icon: Dumbbell, label: "Entreno" },
    { id: "progress", icon: TrendingUp, label: "Progreso" },
    { id: "history", icon: CalendarDays, label: "Historial" },
    { id: "community", icon: Users, label: "Comunidad" },
  ];

  return (
    <div style={{ ...vars, backgroundColor: "var(--bg)", minHeight: "100dvh" }}>
      <div style={{ maxWidth: screen === "community" && !showSettings ? 1152 : 480, margin: "0 auto", position: "relative", minHeight: "100dvh", paddingBottom: "calc(96px + env(safe-area-inset-bottom))" }}>
        {showSettings ? (
          <Settings profile={profile} onSave={saveSettings} onClose={() => setShowSettings(false)} />
        ) : (
          <>
            <div className="flex items-center justify-end gap-2 px-6 pt-4">
              <InstallAppButton />
              <button onClick={() => setShowSettings(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: "1px solid var(--border)" }} title="Ajustes">
                <SettingsIcon size={15} color="var(--text)" />
              </button>
              <button onClick={() => setDark((d) => !d)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: "1px solid var(--border)" }}>
                {dark ? <Sun size={15} color="var(--text)" /> : <Moon size={15} color="var(--text)" />}
              </button>
              <button onClick={handleLogout} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: "1px solid var(--border)" }} title="Cerrar sesión">
                <LogOut size={15} color="var(--text)" />
              </button>
            </div>

            {screen === "dashboard" && (currentNutrition?.error || streakError) && (
              <div role="status" className="mx-6 mt-3 rounded-xl border border-amber-500 p-3 text-sm" style={{ color: "var(--text)" }}>
                Algunos datos no están disponibles.
                <button className="ml-2 underline" onClick={() => setDashboardRetry((value) => value + 1)}>Reintentar</button>
              </div>
            )}
            {screen === "dashboard" && <Dashboard profile={profile} targets={targets} meals={meals} water={water} onAddWater={addWater} onDeleteMeal={deleteMeal} streak={streak} nutritionReady={currentNutrition?.error === false} nutritionError={currentNutrition?.error} />}
            {screen === "scan" && <ScanMeal onAddMeal={addMeal} />}
            {detailKey && currentDetails?.error && (
              <div role="status" className="mx-6 mt-3 rounded-xl border border-amber-500 p-3 text-sm" style={{ color: "var(--text)" }}>
                No se pudieron cargar tus registros.
                <button className="ml-2 underline" onClick={() => setDetailRetry((value) => value + 1)}>Reintentar</button>
              </div>
            )}
            {screen === "workouts" && <Workouts profile={profile} done={currentDetails ? done : []} onToggle={toggleExercise} appDate={appDate} />}
            {screen === "progress" && <Progress profile={profile} weightLog={currentDetails ? weightLog : []} recordsLoading={!currentDetails} onAddWeight={addWeight} onUpdateHeight={updateHeight} dark={dark} />}
            {screen === "history" && <History />}
            {screen === "community" && <Community suggestedName={profile.name} messageSignals={messageSignals} messagePeer={messagePeer} onMessageOpened={() => setMessagePeer(null)} onActivePeer={setActivePeer} sharedPost={sharedPost} sharedPerson={sharedPerson} onClearSharedPost={() => { setSharedPost(null); setSharedPerson(null); }} />}
          </>
        )}

        {messageSignals.notice && <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-30 flex w-[min(24rem,calc(100%-1.5rem))] items-center gap-2 rounded-2xl border p-2 shadow-xl"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}>
          <button className="flex min-h-11 min-w-0 flex-1 items-center gap-3 px-2 text-left" type="button" onClick={() => {
            setMessagePeer(messageSignals.notice);
            setSharedPost(null);
            setSharedPerson(null);
            setShowSettings(false);
            setScreen("community");
            messageSignals.dismiss();
          }}>
            <MessageCircle size={20} className="shrink-0 text-violet-400" aria-hidden="true" />
            <span className="min-w-0" role="status"><strong className="block text-sm">Nuevo mensaje</strong><span className="block truncate text-xs">{messageSignals.notice.display_name}</span></span>
          </button>
          <button className="grid min-h-11 min-w-11 place-items-center" type="button" aria-label="Cerrar aviso de mensaje" onClick={messageSignals.dismiss}><X size={17} /></button>
        </div>}

        {!showSettings && (
          <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around py-3 px-4"
            style={{ backgroundColor: "var(--card)", borderTop: "1px solid var(--border)", paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))", maxWidth: 480, margin: "0 auto" }}>
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = screen === t.id;
              const isScan = t.id === "scan";
              return (
                <button key={t.id} onClick={() => setScreen(t.id)} aria-current={active ? "page" : undefined} aria-label={t.id === "community" && messageSignals.unread ? `Comunidad, ${messageSignals.unread} mensajes sin leer` : undefined} className="relative flex min-w-0 flex-1 flex-col items-center gap-1">
                  {isScan ? (
                    <div className="w-11 h-11 -mt-6 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
                      <Icon size={20} color="#fff" />
                    </div>
                  ) : (
                    <Icon size={20} color={active ? T.ai1 : "var(--sub)"} />
                  )}
                  {t.id === "community" && messageSignals.unread > 0 && <span className="absolute -top-1 left-1/2 ml-2 rounded-full bg-violet-700 px-1 text-[9px] leading-4 text-white" aria-hidden="true">{messageSignals.unread > 99 ? "99+" : messageSignals.unread}</span>}
                  <span className="max-w-full truncate text-[9px] font-medium min-[375px]:text-[10px]" style={{ color: active ? T.ai1 : "var(--sub)" }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
