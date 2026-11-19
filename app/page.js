"use client";

import { InstallAppButton } from "@/components/InstallApp";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Home, Camera, Dumbbell, TrendingUp, Moon, Sun, LogOut, CalendarDays, Settings as SettingsIcon } from "lucide-react";
import { AuthScreen, Onboarding, Dashboard, ScanMeal, Workouts, Progress, History, Settings } from "@/components/Screens";
import { calcProfile, T } from "@/lib/nutrition";
import { computeAppDate } from "@/lib/appDate";

async function fetchDashboardData(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("No se pudieron cargar los datos");
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const [dashboardError, setDashboardError] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);
  const [screen, setScreen] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const [dark, setDark] = useState(true);
  const [meals, setMeals] = useState([]);
  const [water, setWater] = useState(0);
  const [weightLog, setWeightLog] = useState([]);
  const [done, setDone] = useState([]);
  const [streak, setStreak] = useState(0);
  const [appDate, setAppDate] = useState(() => computeAppDate(new Date(), "07:00"));

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

  const loadMeals = useCallback(async (date) => {
    const d = await fetchDashboardData(`/api/meals?date=${date}`);
    setMeals(d.meals || []);
  }, []);
  const loadWater = useCallback(async (date) => {
    const d = await fetchDashboardData(`/api/water?date=${date}`);
    setWater(d.total_ml || 0);
  }, []);
  const loadWeight = useCallback(async () => {
    const d = await fetchDashboardData("/api/weight");
    setWeightLog(d.logs || []);
  }, []);
  const loadWorkouts = useCallback(async (date) => {
    const d = await fetchDashboardData(`/api/workouts?date=${date}`);
    setDone(d.completed || []);
  }, []);
  const loadStreak = useCallback(async (date) => {
    const d = await fetchDashboardData(`/api/streak?today=${date}`);
    setStreak(d.streak || 0);
  }, []);

  const loadAllForDate = useCallback(async (date) => {
    const results = await Promise.allSettled([loadMeals(date), loadWater(date), loadWeight(), loadWorkouts(date), loadStreak(date)]);
    setDashboardError(results.some((result) => result.status === "rejected"));
  }, [loadMeals, loadWater, loadWeight, loadWorkouts, loadStreak]);

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
        await loadAllForDate(date);
      }
    } catch {
      setSessionError(true);
    } finally {
      setLoading(false);
    }
  }, [loadAllForDate]);

  useEffect(() => { refreshSession(); }, [refreshSession]);

  // Cuando el "día" cambia (llegó la hora de levantarse) mientras la app sigue abierta.
  useEffect(() => {
    if (profile) loadAllForDate(appDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appDate]);

  async function handleOnboardingComplete(p) {
    const res = await fetch("/api/profile", { method: "POST", body: JSON.stringify(p) }).then((r) => r.json());
    setProfile(res.profile);
    const date = computeAppDate(new Date(), p.wakeTime);
    setAppDate(date);
    await fetch("/api/weight", { method: "POST", body: JSON.stringify({ weight: p.weight, app_date: date }) });
    await loadAllForDate(date);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setProfile(null);
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
  ];

  return (
    <div style={{ ...vars, backgroundColor: "var(--bg)", minHeight: "100dvh" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", position: "relative", minHeight: "100dvh", paddingBottom: "calc(96px + env(safe-area-inset-bottom))" }}>
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

            {screen === "dashboard" && dashboardError && (
              <div role="status" className="mx-6 mt-3 rounded-xl border border-amber-500 p-3 text-sm" style={{ color: "var(--text)" }}>
                Algunos datos no están disponibles.
                <button className="ml-2 underline" onClick={() => loadAllForDate(appDate)}>Reintentar</button>
              </div>
            )}
            {screen === "dashboard" && <Dashboard profile={profile} targets={targets} meals={meals} water={water} onAddWater={addWater} onDeleteMeal={deleteMeal} streak={streak} />}
            {screen === "scan" && <ScanMeal onAddMeal={addMeal} />}
            {screen === "workouts" && <Workouts profile={profile} done={done} onToggle={toggleExercise} />}
            {screen === "progress" && <Progress profile={profile} weightLog={weightLog} onAddWeight={addWeight} onUpdateHeight={updateHeight} dark={dark} />}
            {screen === "history" && <History />}
          </>
        )}

        {!showSettings && (
          <div className="fixed bottom-0 left-0 right-0 flex items-center justify-around py-3 px-4"
            style={{ backgroundColor: "var(--card)", borderTop: "1px solid var(--border)", paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))", maxWidth: 480, margin: "0 auto" }}>
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = screen === t.id;
              const isScan = t.id === "scan";
              return (
                <button key={t.id} onClick={() => setScreen(t.id)} className="flex flex-col items-center gap-1 px-2">
                  {isScan ? (
                    <div className="w-11 h-11 -mt-6 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
                      <Icon size={20} color="#fff" />
                    </div>
                  ) : (
                    <Icon size={20} color={active ? T.ai1 : "var(--sub)"} />
                  )}
                  <span className="text-[10px] font-medium" style={{ color: active ? T.ai1 : "var(--sub)" }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
