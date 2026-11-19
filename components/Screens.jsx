"use client";

import dynamic from "next/dynamic";
import { prepareScanImage } from "@/lib/scanImage";
import { useState, useRef, useMemo, useEffect } from "react";
import {
  Camera, Upload, Plus, Check, X, ChevronLeft, ChevronRight, Loader2, Sparkles,
  ArrowRight, Scale, Beef, Wheat, Nut, Droplet, Clock, Zap,
  RotateCcw, AlertCircle, Dumbbell, TrendingUp, Ruler, RefreshCw, Trash2,
} from "lucide-react";
import { T, ACTIVITY, GOALS, calcProfile, bmiCategory, MUSCLE_GROUPS, EXERCISES, restToSeconds } from "@/lib/nutrition";

const WeightChart = dynamic(() => import("./WeightChart"), {
  ssr: false,
  loading: () => <p role="status" className="h-[180px] py-6 text-center text-sm">Cargando gráfica…</p>,
});

/* ---------------------------------------------------------
   UI PRIMITIVES
--------------------------------------------------------- */
function Ring({ pct, color, size = 116, stroke = 12, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct || 0));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - clamped)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function MacroBar({ label, value, goal, color, icon, unit = "g", sub }) {
  const pct = Math.min(100, (value / goal) * 100 || 0);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: color + "22" }}>
            {icon}
          </div>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--sub)" }}>
          {Math.round(value)}<span style={{ opacity: 0.5 }}>/{goal}{unit}</span>
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.6s ease" }} />
      </div>
      {sub && <div className="text-xs mt-1" style={{ color: "var(--sub)" }}>{sub}</div>}
    </div>
  );
}

function Card({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-3xl p-5 ${className}`} style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", ...style }}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------
   LOGIN / REGISTRO
--------------------------------------------------------- */
export function AuthScreen({ onAuthed, installAction }) {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Algo salió mal, intenta de nuevo");
        setLoading(false);
        return;
      }
      await onAuthed();
    } catch (e) {
      setError("No se pudo conectar. Revisa tu internet e intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6" style={{ color: "var(--text)" }}>
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5" style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
          <Sparkles size={28} color="#fff" />
        </div>
        <h1 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>NutriCoach AI</h1>
        <p className="text-sm" style={{ color: "var(--sub)" }}>
          {mode === "login" ? "Inicia sesión para ver tu progreso" : "Crea tu cuenta para guardar tu progreso"}
        </p>
      </div>

      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Correo</label>
      <input
        type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com"
        className="w-full mt-2 mb-4 px-4 py-3 rounded-xl text-base outline-none"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
      />
      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Contraseña</label>
      <input
        type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
        className="w-full mt-2 mb-2 px-4 py-3 rounded-xl text-base outline-none"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
      />

      {error && (
        <div className="flex items-center gap-2 mt-2 mb-2">
          <AlertCircle size={14} color={T.calories} />
          <span className="text-xs" style={{ color: T.calories }}>{error}</span>
        </div>
      )}

      <button
        onClick={submit} disabled={loading || !email || !password}
        className="w-full mt-4 py-4 rounded-2xl font-medium text-white flex items-center justify-center gap-2"
        style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})`, opacity: loading || !email || !password ? 0.7 : 1 }}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
      </button>

      <button
        onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
        className="mt-5 text-sm font-medium text-center"
        style={{ color: T.ai1 }}
      >
        {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
      {installAction && <div className="mt-5 flex justify-center">{installAction}</div>}
    </div>
  );
}

/* ---------------------------------------------------------
   ONBOARDING
--------------------------------------------------------- */
export function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState({
    name: "", sex: "hombre", age: 25, height: 170, weight: 70, targetWeight: 65,
    activity: "moderado", goal: "perder_grasa", trainDays: 4,
    place: "gimnasio", equipment: [], wakeTime: "07:00",
  });
  const steps = ["Bienvenida", "Perfil", "Cuerpo", "Actividad", "Objetivo", "Entrenamiento", "Listo"];
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const toggleEquip = (item) =>
    setP((s) => ({ ...s, equipment: s.equipment.includes(item) ? s.equipment.filter((e) => e !== item) : [...s.equipment, item] }));
  const canNext = () => (step === 1 ? p.name.trim().length > 0 : true);

  const finish = async () => {
    setSaving(true);
    await onComplete(p);
    setSaving(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ color: "var(--text)" }}>
      {step > 0 && (
        <div className="px-6 pt-6 flex gap-1.5">
          {steps.slice(1).map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full" style={{ backgroundColor: i < step ? T.ai1 : "var(--border)" }} />
          ))}
        </div>
      )}

      <div className="flex-1 px-6 pt-8 pb-4">
        {step === 0 && (
          <div className="flex flex-col items-center text-center pt-16">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
              <Sparkles size={36} color="#fff" />
            </div>
            <h1 className="text-3xl font-semibold mb-3" style={{ fontFamily: "var(--font-display)" }}>NutriCoach AI</h1>
            <p className="text-base leading-relaxed mb-10" style={{ color: "var(--sub)" }}>
              Tu entrenador personal y nutricionista con inteligencia artificial. Fotografía tu comida, sigue tu progreso y entrena con un plan hecho para ti.
            </p>
            <button onClick={() => setStep(1)}
              className="w-full py-4 rounded-2xl font-medium text-white flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
              Comenzar <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>Cuéntanos de ti</h2>
            <p className="text-sm mb-6" style={{ color: "var(--sub)" }}>Lo básico para personalizar tu experiencia</p>
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Nombre</label>
            <input value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Tu nombre"
              className="w-full mt-2 mb-5 px-4 py-3 rounded-xl text-base outline-none"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Sexo</label>
            <div className="flex gap-3 mt-2 mb-5">
              {["hombre", "mujer"].map((s) => (
                <button key={s} onClick={() => set("sex", s)} className="flex-1 py-3 rounded-xl font-medium capitalize"
                  style={{ backgroundColor: p.sex === s ? T.ai1 : "var(--bg)", color: p.sex === s ? "#fff" : "var(--text)", border: `1px solid ${p.sex === s ? T.ai1 : "var(--border)"}` }}>
                  {s}
                </button>
              ))}
            </div>
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Edad: {p.age} años</label>
            <input type="range" min="14" max="80" value={p.age} onChange={(e) => set("age", +e.target.value)} className="w-full mt-2" />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>Tu cuerpo</h2>
            <p className="text-sm mb-6" style={{ color: "var(--sub)" }}>Para calcular tus necesidades calóricas exactas</p>
            {[
              { k: "height", label: "Altura (cm)", min: 130, max: 220 },
              { k: "weight", label: "Peso actual (kg)", min: 35, max: 200 },
              { k: "targetWeight", label: "Peso objetivo (kg)", min: 35, max: 200 },
            ].map((f) => (
              <div key={f.k} className="mb-5">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>{f.label}: {p[f.k]}</label>
                <input type="range" min={f.min} max={f.max} value={p[f.k]} onChange={(e) => set(f.k, +e.target.value)} className="w-full mt-2" />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>Nivel de actividad</h2>
            <p className="text-sm mb-6" style={{ color: "var(--sub)" }}>¿Cómo describirías tu día a día?</p>
            <div className="space-y-2">
              {Object.entries(ACTIVITY).map(([k, v]) => (
                <button key={k} onClick={() => set("activity", k)} className="w-full text-left px-4 py-3.5 rounded-xl flex items-center justify-between"
                  style={{ backgroundColor: p.activity === k ? T.ai1 + "18" : "var(--bg)", border: `1px solid ${p.activity === k ? T.ai1 : "var(--border)"}` }}>
                  <span className="font-medium">{v.label}</span>
                  {p.activity === k && <Check size={18} color={T.ai1} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>Tu objetivo principal</h2>
            <p className="text-sm mb-6" style={{ color: "var(--sub)" }}>Ajustaremos tus calorías y macros según esto</p>
            <div className="space-y-2">
              {Object.entries(GOALS).map(([k, v]) => (
                <button key={k} onClick={() => set("goal", k)} className="w-full text-left px-4 py-3.5 rounded-xl flex items-center justify-between"
                  style={{ backgroundColor: p.goal === k ? T.ai1 + "18" : "var(--bg)", border: `1px solid ${p.goal === k ? T.ai1 : "var(--border)"}` }}>
                  <span className="font-medium">{v.label}</span>
                  {p.goal === k && <Check size={18} color={T.ai1} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>Entrenamiento</h2>
            <p className="text-sm mb-6" style={{ color: "var(--sub)" }}>Dónde y cómo prefieres entrenar</p>
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Lugar</label>
            <div className="flex gap-2 mt-2 mb-5">
              {["Casa", "Gimnasio", "Ambos"].map((s) => (
                <button key={s} onClick={() => set("place", s.toLowerCase())} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: p.place === s.toLowerCase() ? T.ai1 : "var(--bg)", color: p.place === s.toLowerCase() ? "#fff" : "var(--text)", border: `1px solid ${p.place === s.toLowerCase() ? T.ai1 : "var(--border)"}` }}>
                  {s}
                </button>
              ))}
            </div>
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Equipo disponible</label>
            <div className="flex flex-wrap gap-2 mt-2 mb-5">
              {["Mancuernas", "Barra", "Bandas", "Máquinas", "Ninguno"].map((eq) => (
                <button key={eq} onClick={() => toggleEquip(eq)} className="px-3.5 py-2 rounded-full text-sm font-medium"
                  style={{ backgroundColor: p.equipment.includes(eq) ? T.ai1 : "var(--bg)", color: p.equipment.includes(eq) ? "#fff" : "var(--text)", border: `1px solid ${p.equipment.includes(eq) ? T.ai1 : "var(--border)"}` }}>
                  {eq}
                </button>
              ))}
            </div>
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Días por semana: {p.trainDays}</label>
            <input type="range" min="1" max="7" value={p.trainDays} onChange={(e) => set("trainDays", +e.target.value)} className="w-full mt-2" />

            <div className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: T.ai1 + "12", border: `1px solid ${T.ai1}33` }}>
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: T.ai1 }}>¿A qué hora te levantas normalmente?</label>
              <p className="text-xs mt-1 mb-2" style={{ color: "var(--sub)" }}>Tu día (calorías, agua, entrenamiento) se reinicia a esta hora, no a medianoche.</p>
              <div className="text-center text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-mono)", color: T.ai1 }}>
                {String(parseInt(p.wakeTime, 10)).padStart(2, "0")}:00
              </div>
              <input type="range" min="0" max="23" value={parseInt(p.wakeTime, 10)} onChange={(e) => set("wakeTime", `${e.target.value}:00`)} className="w-full" />
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: T.protein + "22" }}>
              <Check size={30} color={T.protein} />
            </div>
            <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>Todo listo, {p.name.split(" ")[0]}</h2>
            <p className="text-sm mb-8" style={{ color: "var(--sub)" }}>Calculamos tu plan nutricional personalizado</p>
            <PreviewStats profile={p} />
          </div>
        )}
      </div>

      <div className="px-6 pb-8 pt-2 flex gap-3">
        {step > 0 && step < 6 && (
          <button onClick={() => setStep(step - 1)} className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ border: "1px solid var(--border)" }}>
            <ChevronLeft size={20} />
          </button>
        )}
        {step < 6 && step > 0 && (
          <button onClick={() => setStep(step + 1)} disabled={!canNext()}
            className="flex-1 py-4 rounded-2xl font-medium text-white flex items-center justify-center gap-2"
            style={{ background: canNext() ? `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` : "var(--border)" }}>
            Continuar <ArrowRight size={18} />
          </button>
        )}
        {step === 6 && (
          <button onClick={finish} disabled={saving}
            className="flex-1 py-4 rounded-2xl font-medium text-white flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <>Ir a mi Dashboard <ArrowRight size={18} /></>}
          </button>
        )}
      </div>
    </div>
  );
}

function PreviewStats({ profile }) {
  const c = calcProfile(profile);
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {[
        { label: "Calorías/día", value: c.calories, color: T.calories },
        { label: "Proteína", value: c.protein + "g", color: T.protein },
        { label: "Carbohidratos", value: c.carbs + "g", color: T.carbs },
        { label: "Grasas", value: c.fat + "g", color: T.fat },
      ].map((s) => (
        <Card key={s.label}>
          <div className="text-2xl font-semibold" style={{ fontFamily: "var(--font-mono)", color: s.color }}>{s.value}</div>
          <div className="text-xs mt-1" style={{ color: "var(--sub)" }}>{s.label}</div>
        </Card>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------
   AI FOOD SCAN
--------------------------------------------------------- */
export function ScanMeal({ onAddMeal }) {
  const [imgData, setImgData] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | analyzing | done | error
  const [result, setResult] = useState(null);
  const [mealType, setMealType] = useState("Almuerzo");
  const [notaManual, setNotaManual] = useState("");
  const [showSlow, setShowSlow] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualItem, setManualItem] = useState({ nombre: "", calorias: "", proteina_g: "", carbohidratos_g: "", grasa_g: "" });
  const fileRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    if (status !== "analyzing") { setShowSlow(false); return; }
    const t = setTimeout(() => setShowSlow(true), 8000);
    return () => clearTimeout(t);
  }, [status]);

  const [photoError, setPhotoError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setPhotoError("");
    setImgData(null);
    setStatus("idle");
    setResult(null);
      setNotaManual("");
    try {
      setImgData(await prepareScanImage(file));
    } catch {
      setPhotoError("No pudimos abrir esta foto. Prueba con una imagen JPG o PNG.");
    }
  };

  const analyze = async () => {
    if (!imgData) return;
    setPhotoError("");
    setStatus("analyzing");
    try {
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: imgData.base64, mediaType: imgData.mediaType, notaManual }),
      });
      const parsed = await res.json();
      if (!res.ok || parsed.error) throw new Error(parsed.error || "Error de análisis");
      setResult(parsed);
      setStatus("done");
    } catch (error) {
      setPhotoError(error instanceof SyntaxError ? "El servidor no pudo procesar la foto." : error.message);
      setStatus("error");
    }
  };

  const totals = useMemo(() => {
    if (!result) return null;
    return result.alimentos.reduce(
      (acc, f) => ({
        calorias: acc.calorias + (f.calorias || 0),
        proteina_g: acc.proteina_g + (f.proteina_g || 0),
        carbohidratos_g: acc.carbohidratos_g + (f.carbohidratos_g || 0),
        grasa_g: acc.grasa_g + (f.grasa_g || 0),
      }),
      { calorias: 0, proteina_g: 0, carbohidratos_g: 0, grasa_g: 0 }
    );
  }, [result]);

  const addManualItem = () => {
    if (!manualItem.nombre || !manualItem.calorias) return;
    setResult((r) => ({
      ...r,
      alimentos: [
        ...r.alimentos,
        {
          nombre: manualItem.nombre,
          porcion: "agregado manualmente",
          peso_g: 0,
          calorias: Number(manualItem.calorias) || 0,
          proteina_g: Number(manualItem.proteina_g) || 0,
          carbohidratos_g: Number(manualItem.carbohidratos_g) || 0,
          grasa_g: Number(manualItem.grasa_g) || 0,
          fibra_g: 0, azucares_g: 0, sodio_mg: 0,
        },
      ],
    }));
    setManualItem({ nombre: "", calorias: "", proteina_g: "", carbohidratos_g: "", grasa_g: "" });
    setShowManualAdd(false);
  };

  const reset = () => { setImgData(null); setStatus("idle"); setResult(null); setNotaManual(""); };

  return (
    <div className="px-6 pt-6 pb-6" style={{ color: "var(--text)" }}>
      <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>Escanear comida</h2>
      <p className="text-sm mb-5" style={{ color: "var(--sub)" }}>Toma o sube una foto y la IA calculará las calorías y macros</p>

      {!imgData && (
        <div className="rounded-3xl flex flex-col items-center justify-center py-16 px-6" style={{ border: `1.5px dashed ${T.ai1}55`, backgroundColor: "var(--card)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
            <Camera size={28} color="#fff" />
          </div>
          <p className="text-sm mb-6 text-center" style={{ color: "var(--sub)" }}>Fotografía tu plato para un análisis instantáneo con IA</p>
          <div className="flex gap-3 w-full">
            <button onClick={() => fileRef.current.click()} className="flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
              <Camera size={16} /> Tomar foto
            </button>
            <button onClick={() => galleryRef.current.click()} className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2" style={{ border: "1px solid var(--border)" }}>
              <Upload size={16} /> Subir
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }} />
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }} />
          {photoError && !imgData && <p role="alert" className="my-2 text-sm">{photoError}</p>}
        </div>
      )}

      {imgData && (
        <div>
          <div className="rounded-3xl overflow-hidden relative mb-4" style={{ border: "1px solid var(--border)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgData.previewUrl} alt="comida" className="w-full h-64 object-cover" />
            {status === "analyzing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: "#00000055" }}>
                <div className="w-full h-0.5 absolute scan-line" style={{ background: `linear-gradient(90deg, transparent, ${T.ai1}, transparent)` }} />
                <Loader2 size={30} color="#fff" className="animate-spin mb-2" />
                <span className="text-white text-sm font-medium">Analizando alimentos…</span>
              </div>
            )}
            <button onClick={reset} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#00000077" }}>
              <X size={16} color="#fff" />
            </button>
          </div>

          <style>{`
            .scan-line { animation: scanmove 1.6s ease-in-out infinite; top: 0; }
            @keyframes scanmove { 0% { top: 0%; } 50% { top: 96%; } 100% { top: 0%; } }
          `}</style>

          {status === "idle" && (
            <div className="mb-4">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>
                ¿Falta algo en la foto? (opcional)
              </label>
              <textarea
                value={notaManual}
                onChange={(e) => setNotaManual(e.target.value)}
                placeholder="Ej: una cucharada de aceite, una rebanada de pan integral…"
                rows={2}
                className="w-full mt-2 px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>
          )}

          {status === "idle" && (
            <button onClick={analyze} className="w-full py-4 rounded-2xl font-medium text-white flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
              <Sparkles size={18} /> Analizar con IA
            </button>
          )}

          {status === "analyzing" && showSlow && (
            <p className="text-xs text-center mt-3" style={{ color: "var(--sub)" }}>
              Esto está tardando más de lo normal… seguimos intentando, no cierres la app.
            </p>
          )}

          {status === "error" && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: T.calories + "18" }}>
              <AlertCircle size={18} color={T.calories} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2" role="alert">{photoError || "No pudimos analizar la imagen"}</p>
                <button onClick={analyze} className="text-sm font-medium flex items-center gap-1" style={{ color: T.ai1 }}>
                  <RotateCcw size={14} /> Reintentar
                </button>
              </div>
            </div>
          )}

          {status === "done" && result && (
            <div>
              {result.confianza !== "alta" && (
                <div className="rounded-2xl p-3 mb-4 flex items-start gap-2" style={{ backgroundColor: T.carbs + "1A" }}>
                  <AlertCircle size={16} color={T.carbs} className="mt-0.5 shrink-0" />
                  <p className="text-xs" style={{ color: "var(--sub)" }}>{result.nota || "Confianza media/baja en la identificación. Revisa los alimentos detectados."}</p>
                </div>
              )}

              <Card className="mb-4" style={{ borderColor: T.ai1 + "55" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} color={T.ai1} />
                  <span className="text-sm font-medium">Esta comida contiene aproximadamente</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.calories }}>{Math.round(totals.calorias)}</div>
                    <div className="text-xs" style={{ color: "var(--sub)" }}>kcal</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.protein }}>{Math.round(totals.proteina_g)}g</div>
                    <div className="text-xs" style={{ color: "var(--sub)" }}>Prot</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.carbs }}>{Math.round(totals.carbohidratos_g)}g</div>
                    <div className="text-xs" style={{ color: "var(--sub)" }}>Carb</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.fat }}>{Math.round(totals.grasa_g)}g</div>
                    <div className="text-xs" style={{ color: "var(--sub)" }}>Grasa</div>
                  </div>
                </div>
              </Card>

              <div className="space-y-2 mb-5">
                {result.alimentos.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
                    <div>
                      <div className="text-sm font-medium">{f.nombre}</div>
                      <div className="text-xs" style={{ color: "var(--sub)" }}>{f.porcion} · {f.peso_g}g</div>
                    </div>
                    <div className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--sub)" }}>{Math.round(f.calorias)} kcal</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowManualAdd((s) => !s)}
                className="w-full mb-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                style={{ border: `1px dashed ${T.ai1}66`, color: T.ai1 }}
              >
                <Plus size={15} /> Agregar alimento que faltó
              </button>

              {showManualAdd && (
                <Card className="mb-4">
                  <input
                    value={manualItem.nombre}
                    onChange={(e) => setManualItem((m) => ({ ...m, nombre: e.target.value }))}
                    placeholder="Nombre del alimento"
                    className="w-full mb-2 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <input type="number" value={manualItem.calorias} onChange={(e) => setManualItem((m) => ({ ...m, calorias: e.target.value }))} placeholder="Calorías" className="px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
                    <input type="number" value={manualItem.proteina_g} onChange={(e) => setManualItem((m) => ({ ...m, proteina_g: e.target.value }))} placeholder="Proteína (g)" className="px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
                    <input type="number" value={manualItem.carbohidratos_g} onChange={(e) => setManualItem((m) => ({ ...m, carbohidratos_g: e.target.value }))} placeholder="Carbs (g)" className="px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
                    <input type="number" value={manualItem.grasa_g} onChange={(e) => setManualItem((m) => ({ ...m, grasa_g: e.target.value }))} placeholder="Grasa (g)" className="px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
                  </div>
                  <button onClick={addManualItem} className="w-full py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: T.ai1 }}>
                    Agregar a esta comida
                  </button>
                </Card>
              )}

              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Tipo de comida</label>
              <div className="flex gap-2 mt-2 mb-5">
                {["Desayuno", "Almuerzo", "Cena", "Snack"].map((t) => (
                  <button key={t} onClick={() => setMealType(t)} className="flex-1 py-2 rounded-xl text-xs font-medium"
                    style={{ backgroundColor: mealType === t ? T.ai1 : "transparent", color: mealType === t ? "#fff" : "var(--text)", border: `1px solid ${mealType === t ? T.ai1 : "var(--border)"}` }}>
                    {t}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { onAddMeal({ type: mealType, items: result.alimentos, totals }); reset(); }}
                className="w-full py-4 rounded-2xl font-medium text-white flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${T.protein}, #0EA37F)` }}>
                <Plus size={18} /> Agregar al registro
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   DASHBOARD
--------------------------------------------------------- */
function greetingFor(hour) {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function Dashboard({ profile, targets, meals, water, onAddWater, onDeleteMeal, streak, nutritionReady, nutritionError }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  const [tip, setTip] = useState("");
  const [tipLoading, setTipLoading] = useState(false);

  const consumed = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.totals?.calorias || 0),
      protein: acc.protein + (m.totals?.proteina_g || 0),
      carbs: acc.carbs + (m.totals?.carbohidratos_g || 0),
      fat: acc.fat + (m.totals?.grasa_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const remaining = Math.max(0, Math.round(targets.calories - consumed.calories));
  const pct = consumed.calories / targets.calories;

  const fetchTip = async () => {
    setTipLoading(true);
    try {
      const n = new Date();
      const res = await fetch("/api/coach-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hora: n.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
          diaSemana: n.toLocaleDateString("es", { weekday: "long" }),
          fecha: n.toLocaleDateString("es", { day: "numeric", month: "long" }),
          consumido: { calories: consumed.calories, protein: consumed.protein, water },
          objetivo: { calories: targets.calories, protein: targets.protein, water: targets.water },
          goal: profile.goal,
        }),
      });
      const data = await res.json();
      setTip(data.tip || "");
    } catch {
      setTip("");
    } finally {
      setTipLoading(false);
    }
  };

  useEffect(() => {
    if (nutritionReady) fetchTip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nutritionReady, meals.length, water]);

  return (
    <div className="px-6 pt-2 pb-6" style={{ color: "var(--text)" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm" style={{ color: "var(--sub)" }}>{greetingFor(now.getHours())}, {profile.name?.split(" ")[0]} 👋</p>
          <h2 className="text-2xl font-semibold capitalize" style={{ fontFamily: "var(--font-display)" }}>{dateLabel}</h2>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: T.carbs + "20" }}>
            <Zap size={14} color={T.carbs} />
            <span className="text-sm font-semibold" style={{ color: T.carbs, fontFamily: "var(--font-mono)" }}>{streak}</span>
          </div>
        )}
      </div>

      {!nutritionReady ? (
        <Card className="mb-4">
          <p role="status" className="text-sm" style={{ color: "var(--sub)" }}>
            {nutritionError ? "No se pudo cargar tu registro de hoy." : "Cargando tu registro de hoy…"}
          </p>
        </Card>
      ) : (
        <>
          <Card className="mb-4" style={{ borderColor: T.ai1 + "40" }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: T.ai1 + "22" }}>
                <Sparkles size={15} color={T.ai1} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold mb-1" style={{ color: T.ai1 }}>Tu coach ahora mismo</div>
                {tipLoading ? (
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--sub)" }}>
                    <Loader2 size={13} className="animate-spin" /> Pensando…
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{tip || "Todo bien por ahora. Sigue con tu plan."}</p>
                )}
              </div>
              <button onClick={fetchTip} className="shrink-0">
                <RefreshCw size={14} color="var(--sub)" />
              </button>
            </div>
          </Card>

          <Card className="mb-4 flex items-center gap-5">
            <Ring pct={pct} color={T.calories}>
              <div className="text-center">
                <div className="text-xl font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{remaining}</div>
                <div className="text-[10px]" style={{ color: "var(--sub)" }}>kcal restantes</div>
              </div>
            </Ring>
            <div className="flex-1">
              <div className="text-sm mb-1" style={{ color: "var(--sub)" }}>Consumidas</div>
              <div className="text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                {Math.round(consumed.calories)} <span className="text-sm font-normal" style={{ color: "var(--sub)" }}>/ {targets.calories}</span>
              </div>
              <div className="flex gap-3 text-xs" style={{ color: "var(--sub)" }}>
                <span>TMB {targets.bmr}</span><span>·</span><span>TDEE {targets.tdee}</span>
              </div>
            </div>
          </Card>

          <Card className="mb-4">
            <MacroBar label="Proteína" value={consumed.protein} goal={targets.protein} color={T.protein} icon={<Beef size={14} color={T.protein} />} />
            <MacroBar label="Carbohidratos" value={consumed.carbs} goal={targets.carbs} color={T.carbs} icon={<Wheat size={14} color={T.carbs} />} />
            <MacroBar label="Grasas" value={consumed.fat} goal={targets.fat} color={T.fat} icon={<Nut size={14} color={T.fat} />} />
            <MacroBar
              label="Agua" value={water} goal={targets.water} unit="ml" color={T.water}
              icon={<Droplet size={14} color={T.water} />}
              sub={<button onClick={onAddWater} className="mt-1 text-xs font-medium flex items-center gap-1" style={{ color: T.water }}><Plus size={12} /> Agregar 250ml</button>}
            />
          </Card>

          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--sub)" }}>REGISTRO DE HOY</h3>
          {meals.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-sm" style={{ color: "var(--sub)" }}>Aún no has registrado comidas. Ve a la pestaña Escanear para empezar.</p>
            </Card>
          )}
          <div className="space-y-2">
            {meals.slice().reverse().map((m) => (
              <Card key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{m.type}</div>
                  <div className="text-xs" style={{ color: "var(--sub)" }}>{(m.items || []).map((f) => f.nombre).join(", ")}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.calories }}>
                    {Math.round(m.totals?.calorias || 0)} kcal
                  </div>
                  <button onClick={() => onDeleteMeal(m.id)}>
                    <Trash2 size={15} color="var(--sub)" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   WORKOUTS
--------------------------------------------------------- */
export function Workouts({ profile, done, onToggle, appDate }) {
  const [group, setGroup] = useState("Cuerpo completo");
  const [inSession, setInSession] = useState(false);
  const exercises = EXERCISES[group];

  if (inSession) {
    return (
      <WorkoutSession
        group={group}
        exercises={exercises}
        onToggle={onToggle}
        onFinish={() => setInSession(false)}
      />
    );
  }

  return (
    <div className="px-6 pt-2 pb-6" style={{ color: "var(--text)" }}>
      <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>Entrenamiento</h2>
      <p className="text-sm mb-5" style={{ color: "var(--sub)" }}>
        {profile.place === "gimnasio" ? "En el gimnasio" : profile.place === "casa" ? "En casa" : "Casa y gimnasio"} · {profile.train_days} días/semana
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {MUSCLE_GROUPS.map((g) => (
          <button key={g} onClick={() => setGroup(g)} className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0"
            style={{ backgroundColor: group === g ? T.ai1 : "transparent", color: group === g ? "#fff" : "var(--text)", border: `1px solid ${group === g ? T.ai1 : "var(--border)"}` }}>
            {g}
          </button>
        ))}
      </div>

      <button
        onClick={() => setInSession(true)}
        className="w-full mb-5 py-4 rounded-2xl font-medium text-white flex items-center justify-center gap-2"
        style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}
      >
        <Zap size={18} /> Iniciar entrenamiento guiado
      </button>

      <div className="space-y-3">
        {exercises.map((ex, i) => {
          const key = group + ex.name;
          const isDone = done.includes(key);
          return (
            <Card key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: T.ai1 + "18" }}>
                <Dumbbell size={20} color={T.ai1} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{ex.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--sub)" }}>{ex.muscles}</div>
                <div className="flex gap-3 mt-1.5 text-xs" style={{ color: "var(--sub)" }}>
                  <span>{ex.sets} series</span><span>·</span><span>{ex.reps}</span><span>·</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {ex.rest}</span>
                </div>
              </div>
              <button onClick={() => onToggle(key)} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: isDone ? T.protein : "transparent", border: `1.5px solid ${isDone ? T.protein : "var(--border)"}` }}>
                {isDone && <Check size={16} color="#fff" />}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function BodyScan({ onApplyWeight, onApplyHeight }) {
  const [imgData, setImgData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const [photoError, setPhotoError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setPhotoError("");
    setImgData(null);
    setStatus("idle");
    setResult(null);
    try {
      setImgData(await prepareScanImage(file));
    } catch {
      setPhotoError("No pudimos abrir esta foto. Prueba con una imagen JPG o PNG.");
    }
  };

  const analyze = async () => {
    if (!imgData) return;
    setPhotoError("");
    setStatus("analyzing");
    try {
      const res = await fetch("/api/analyze-body", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: imgData.base64, mediaType: imgData.mediaType }),
      });
      const parsed = await res.json();
      if (!res.ok || parsed.error) throw new Error(parsed.error || "No se pudo analizar la foto.");
      setResult(parsed);
      setStatus("done");
    } catch (error) {
      setPhotoError(error instanceof SyntaxError ? "El servidor no pudo procesar la foto." : error.message);
      setStatus("error");
    }
  };

  return (
    <Card className="mb-5">
      <div className="flex items-center gap-2 mb-1">
        <Ruler size={16} color={T.ai1} />
        <span className="text-sm font-semibold">Escanear cuerpo (estimado por IA)</span>
      </div>
      <p className="text-xs mb-3" style={{ color: "var(--sub)" }}>
        Foto de cuerpo completo, de frente. Es una aproximación visual, no un reemplazo de la báscula.
      </p>

      {!imgData && (
        <button onClick={() => fileRef.current.click()} className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2" style={{ border: `1px dashed ${T.ai1}66`, color: T.ai1 }}>
          <Camera size={16} /> Tomar o subir foto
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }} />
      {photoError && !imgData && <p role="alert" className="my-2 text-sm">{photoError}</p>}

      {imgData && (
        <div>
          <div className="rounded-2xl overflow-hidden mb-3" style={{ border: "1px solid var(--border)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgData.previewUrl} alt="cuerpo" className="w-full h-56 object-cover" />
          </div>
          {status === "idle" && (
            <button onClick={analyze} className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
              <Sparkles size={16} /> Estimar
            </button>
          )}
          {status === "analyzing" && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm" style={{ color: "var(--sub)" }}>
              <Loader2 size={16} className="animate-spin" /> Analizando…
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 py-2">
              <AlertCircle size={14} color={T.calories} />
              <span role="alert" className="text-sm">{photoError || "No se pudo analizar la foto."}</span>
              <button onClick={analyze} className="text-sm font-medium" style={{ color: T.ai1 }}>Reintentar</button>
            </div>
          )}
          {status === "done" && result && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center">
                  <div className="text-xl font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.ai1 }}>{result.altura_cm_estimada} cm</div>
                  <div className="text-xs" style={{ color: "var(--sub)" }}>Altura estimada</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.ai1 }}>{result.peso_kg_estimado} kg</div>
                  <div className="text-xs" style={{ color: "var(--sub)" }}>Peso estimado</div>
                </div>
              </div>
              {result.nota && <p className="text-xs mb-3" style={{ color: "var(--sub)" }}>{result.nota}</p>}
              <div className="flex gap-2">
                <button onClick={() => onApplyHeight(result.altura_cm_estimada)} className="flex-1 py-2.5 rounded-lg text-xs font-medium" style={{ border: "1px solid var(--border)" }}>
                  Usar altura
                </button>
                <button onClick={() => onApplyWeight(result.peso_kg_estimado)} className="flex-1 py-2.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: T.ai1 }}>
                  Usar peso
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------
   PROGRESS
--------------------------------------------------------- */
export function Progress({ profile, weightLog, onAddWeight, onUpdateHeight, dark, recordsLoading }) {
  const [newWeight, setNewWeight] = useState(Number(profile.weight));
  const latest = weightLog.length ? Number(weightLog[weightLog.length - 1].weight) : Number(profile.weight);
  const bmi = latest / ((Number(profile.height) / 100) ** 2);
  const chartData = weightLog.map((w) => ({
    date: new Date(w.created_at).toLocaleDateString("es", { day: "2-digit", month: "short" }),
    peso: Number(w.weight),
  }));

  return (
    <div className="px-6 pt-2 pb-6" style={{ color: "var(--text)" }}>
      <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>Progreso</h2>
      <p className="text-sm mb-5" style={{ color: "var(--sub)" }}>Sigue tu evolución hacia tu objetivo</p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card>
          <div className="flex items-center gap-1.5 mb-1"><Scale size={14} color={T.ai1} /><span className="text-xs" style={{ color: "var(--sub)" }}>Peso actual</span></div>
          <div className="text-2xl font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{latest.toFixed(1)} kg</div>
        </Card>
        <Card>
          <div className="flex items-center gap-1.5 mb-1"><TrendingUp size={14} color={T.protein} /><span className="text-xs" style={{ color: "var(--sub)" }}>IMC</span></div>
          <div className="text-2xl font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{bmi.toFixed(1)}</div>
          <div className="text-xs" style={{ color: "var(--sub)" }}>{bmiCategory(bmi)}</div>
        </Card>
      </div>

      <Card className="mb-5">
        <div className="text-sm font-semibold mb-3">Meta: {Number(profile.target_weight)} kg</div>
        {recordsLoading ? (
          <p role="status" className="py-6 text-center text-sm">Cargando registros de peso…</p>
        ) : chartData.length > 1 ? (
          <WeightChart data={chartData} dark={dark} />
        ) : (
          <p className="text-sm py-6 text-center" style={{ color: "var(--sub)" }}>Registra al menos 2 pesos para ver tu gráfica de evolución</p>
        )}
      </Card>

      <BodyScan onApplyWeight={onAddWeight} onApplyHeight={onUpdateHeight} />

      <Card>
        <div className="text-sm font-semibold mb-3">Registrar peso de hoy</div>
        <div className="flex gap-3">
          <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(+e.target.value)}
            className="min-w-0 flex-1 px-4 py-3 rounded-xl outline-none" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <button onClick={() => onAddWeight(newWeight)} className="px-5 py-3 rounded-xl font-medium text-white" style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
            Guardar
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------
   DIAGRAMAS VISUALES GENÉRICOS POR PATRÓN DE MOVIMIENTO
--------------------------------------------------------- */
function ExercisePattern({ patron, color }) {
  const stroke = color || T.ai1;
  const common = { fill: "none", stroke, strokeWidth: 4, strokeLinecap: "round", strokeLinejoin: "round" };
  const faded = { ...common, opacity: 0.3, strokeDasharray: "6 5" };

  const Head = (cx, cy, o = 1) => <circle cx={cx} cy={cy} r="10" style={{ fill: "none", stroke, strokeWidth: 4, opacity: o }} />;

  let content;
  if (patron === "empuje_h") {
    content = (<>
      {Head(55, 45, 0.3)}<path d="M55 55 L55 90" {...faded} /><path d="M35 65 L20 45" {...faded} /><path d="M75 65 L90 45" {...faded} />
      {Head(145, 45)}<path d="M145 55 L145 90" {...common} /><path d="M125 65 L140 90" {...common} /><path d="M165 65 L150 90" {...common} />
      <path d="M100 45 L120 45" stroke={stroke} strokeWidth="3" markerEnd="url(#arrow)" strokeDasharray="4 4" />
    </>);
  } else if (patron === "empuje_v") {
    content = (<>
      {Head(100, 95, 0.3)}<path d="M100 105 L100 130" {...faded} /><path d="M100 105 L75 90" {...faded} /><path d="M100 105 L125 90" {...faded} />
      {Head(100, 40)}<path d="M100 50 L100 90" {...common} /><path d="M100 55 L70 30" {...common} /><path d="M100 55 L130 30" {...common} />
      <path d="M100 105 L100 60" stroke={stroke} strokeWidth="3" strokeDasharray="4 4" />
    </>);
  } else if (patron === "traccion_h") {
    content = (<>
      {Head(50, 60)}<path d="M50 70 L50 105" {...common} /><path d="M60 80 L90 55" {...common} /><path d="M40 85 L20 90" {...common} />
      <path d="M95 55 L145 55" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <path d="M120 40 L145 55 L120 70" {...common} />
    </>);
  } else if (patron === "traccion_v") {
    content = (<>
      <path d="M40 20 L160 20" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      {Head(100, 100, 0.3)}<path d="M100 110 L100 130" {...faded} /><path d="M85 60 L60 20" {...faded} /><path d="M115 60 L140 20" {...faded} />
      {Head(100, 70)}<path d="M100 80 L100 110" {...common} /><path d="M85 45 L60 20" {...common} /><path d="M115 45 L140 20" {...common} />
    </>);
  } else if (patron === "sentadilla") {
    content = (<>
      {Head(100, 30, 0.3)}<path d="M100 40 L100 65" {...faded} /><path d="M100 65 L80 100" {...faded} /><path d="M100 65 L120 100" {...faded} />
      {Head(100, 55)}<path d="M100 65 L100 85" {...common} /><path d="M100 85 L75 90 L70 115" {...common} /><path d="M100 85 L125 90 L130 115" {...common} />
    </>);
  } else if (patron === "bisagra") {
    content = (<>
      {Head(60, 30, 0.3)}<path d="M60 40 L100 90" {...faded} /><path d="M100 90 L100 125" {...faded} />
      {Head(100, 45)}<path d="M100 55 L100 90" {...common} /><path d="M100 90 L90 120" {...common} /><path d="M100 90 L110 120" {...common} />
      <path d="M75 40 L120 65" stroke={stroke} strokeWidth="3" strokeDasharray="4 4" />
    </>);
  } else if (patron === "core") {
    content = (<>
      {Head(35, 90)}<path d="M45 90 L155 90" {...common} /><path d="M45 90 L35 115" {...common} /><path d="M155 90 L165 115" {...common} />
      <path d="M60 70 L60 60" {...faded} /><path d="M100 70 L100 55" {...faded} /><path d="M140 70 L140 60" {...faded} />
    </>);
  } else {
    // cardio
    content = (<>
      {Head(60, 50, 0.3)}<path d="M60 60 L65 95 L45 130" {...faded} /><path d="M65 75 L40 60" {...faded} />
      {Head(120, 45)}<path d="M120 55 L110 90 L135 125" {...common} /><path d="M112 68 L140 55" {...common} /><path d="M112 68 L95 90" {...common} />
    </>);
  }

  return (
    <svg viewBox="0 0 200 140" className="w-full" style={{ height: 140 }}>
      {content}
    </svg>
  );
}

/* ---------------------------------------------------------
   ENTRENAMIENTO GUIADO
--------------------------------------------------------- */
export function WorkoutSession({ group, exercises, onToggle, onFinish }) {
  const [index, setIndex] = useState(0);
  const [setNum, setSetNum] = useState(1);
  const [phase, setPhase] = useState("exercise"); // exercise | rest | done
  const [secondsLeft, setSecondsLeft] = useState(0);

  const ex = exercises[index];
  const isLastExercise = index === exercises.length - 1;

  useEffect(() => {
    if (phase !== "rest") return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, secondsLeft]);

  const completeSet = () => {
    if (setNum < ex.sets) {
      const rest = restToSeconds(ex.rest);
      if (rest > 0) {
        setSecondsLeft(rest);
        setPhase("rest");
      } else {
        setSetNum((n) => n + 1);
      }
    } else {
      finishExercise();
    }
  };

  const afterRest = () => {
    setSetNum((n) => n + 1);
    setPhase("exercise");
  };

  const finishExercise = async () => {
    await onToggle(group + ex.name);
    if (isLastExercise) {
      setPhase("done");
    } else {
      setIndex((i) => i + 1);
      setSetNum(1);
      setPhase("exercise");
    }
  };

  const skipExercise = () => {
    if (isLastExercise) {
      setPhase("done");
    } else {
      setIndex((i) => i + 1);
      setSetNum(1);
      setPhase("exercise");
    }
  };

  if (phase === "done") {
    return (
      <div className="px-6 pt-10 pb-6 flex flex-col items-center text-center" style={{ color: "var(--text)" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: T.protein + "22" }}>
          <Check size={30} color={T.protein} />
        </div>
        <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>¡Entrenamiento completado!</h2>
        <p className="text-sm mb-8" style={{ color: "var(--sub)" }}>Terminaste {exercises.length} ejercicios de {group}.</p>
        <button onClick={onFinish} className="w-full py-4 rounded-2xl font-medium text-white"
          style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 pt-2 pb-6" style={{ color: "var(--text)" }}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onFinish} className="text-sm font-medium" style={{ color: "var(--sub)" }}>Salir</button>
        <span className="text-xs font-semibold" style={{ color: "var(--sub)" }}>Ejercicio {index + 1} de {exercises.length}</span>
      </div>

      <div className="w-full h-1.5 rounded-full mb-5" style={{ backgroundColor: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${((index + (phase === "done" ? 1 : 0)) / exercises.length) * 100}%`, backgroundColor: T.ai1, transition: "width 0.4s ease" }} />
      </div>

      {phase === "exercise" && (
        <div>
          <Card className="mb-4">
            <ExercisePattern patron={ex.patron} color={T.ai1} />
          </Card>

          <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>{ex.name}</h2>
          <p className="text-sm mb-4" style={{ color: "var(--sub)" }}>{ex.muscles}</p>

          <Card className="mb-4 flex items-center justify-around text-center">
            <div>
              <div className="text-xl font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.ai1 }}>{setNum}/{ex.sets}</div>
              <div className="text-xs" style={{ color: "var(--sub)" }}>Serie</div>
            </div>
            <div>
              <div className="text-xl font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{ex.reps}</div>
              <div className="text-xs" style={{ color: "var(--sub)" }}>Reps</div>
            </div>
            <div>
              <div className="text-xl font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{ex.rest}</div>
              <div className="text-xs" style={{ color: "var(--sub)" }}>Descanso</div>
            </div>
          </Card>

          <Card className="mb-4">
            <div className="text-xs font-semibold mb-2" style={{ color: "var(--sub)" }}>CÓMO HACERLO</div>
            <ol className="space-y-1.5 mb-3">
              {ex.pasos.map((p, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="font-semibold shrink-0" style={{ color: T.ai1 }}>{i + 1}.</span>{p}
                </li>
              ))}
            </ol>
            <div className="text-xs font-semibold mb-2" style={{ color: T.calories }}>ERRORES COMUNES</div>
            <ul className="space-y-1">
              {ex.errores.map((e, i) => (
                <li key={i} className="text-xs flex gap-2" style={{ color: "var(--sub)" }}>
                  <X size={12} color={T.calories} className="mt-0.5 shrink-0" />{e}
                </li>
              ))}
            </ul>
          </Card>

          <button onClick={completeSet} className="w-full py-4 rounded-2xl font-medium text-white mb-2"
            style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
            {setNum < ex.sets ? "Completar serie" : "Terminar ejercicio"}
          </button>
          <button onClick={skipExercise} className="w-full py-3 rounded-2xl text-sm font-medium" style={{ color: "var(--sub)" }}>
            Saltar este ejercicio
          </button>
        </div>
      )}

      {phase === "rest" && (
        <div className="flex flex-col items-center pt-10">
          <div className="text-sm font-semibold mb-2" style={{ color: "var(--sub)" }}>DESCANSA</div>
          <div className="text-6xl font-semibold mb-8" style={{ fontFamily: "var(--font-mono)", color: T.ai1 }}>
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
          </div>
          <p className="text-sm mb-8 text-center" style={{ color: "var(--sub)" }}>
            Siguiente: serie {setNum + 1} de {ex.sets} — {ex.name}
          </p>
          {secondsLeft <= 0 ? (
            <button onClick={afterRest} className="w-full py-4 rounded-2xl font-medium text-white"
              style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
              Siguiente serie
            </button>
          ) : (
            <button onClick={afterRest} className="w-full py-3 rounded-2xl text-sm font-medium" style={{ border: "1px solid var(--border)" }}>
              Saltar descanso
            </button>
          )}
        </div>
      )}
    </div>
  );
}
/* ---------------------------------------------------------
   AJUSTES
--------------------------------------------------------- */
export function Settings({ profile, onSave, onClose }) {
  const [p, setP] = useState({
    name: profile.name || "",
    age: Number(profile.age),
    height: Number(profile.height),
    targetWeight: Number(profile.target_weight),
    activity: profile.activity,
    goal: profile.goal,
    place: profile.place,
    trainDays: profile.train_days,
    equipment: profile.equipment || [],
    wakeTime: profile.wake_time || "07:00",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const toggleEquip = (item) =>
    setP((s) => ({ ...s, equipment: s.equipment.includes(item) ? s.equipment.filter((e) => e !== item) : [...s.equipment, item] }));

  const wakeHour = parseInt((p.wakeTime || "07:00").split(":")[0], 10);

  const save = async () => {
    setSaving(true);
    await onSave({ ...p, wakeTime: `${String(wakeHour).padStart(2, "0")}:00` });
    setSaving(false);
    onClose();
  };

  return (
    <div className="px-6 pt-2 pb-8" style={{ color: "var(--text)" }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Ajustes</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: "1px solid var(--border)" }}>
          <X size={16} />
        </button>
      </div>

      <Card className="mb-4" style={{ borderColor: T.ai1 + "40" }}>
        <div className="flex items-center gap-2 mb-1">
          <Clock size={15} color={T.ai1} />
          <span className="text-sm font-semibold">¿A qué hora te levantas?</span>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--sub)" }}>Tu día (calorías, agua, entrenamiento) se reinicia a esta hora, no a medianoche.</p>
        <div className="text-center text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-mono)", color: T.ai1 }}>
          {String(wakeHour).padStart(2, "0")}:00
        </div>
        <input type="range" min="0" max="23" value={wakeHour} onChange={(e) => set("wakeTime", `${e.target.value}:00`)} className="w-full" />
      </Card>

      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Nombre</label>
      <input value={p.name} onChange={(e) => set("name", e.target.value)}
        className="w-full mt-2 mb-4 px-4 py-3 rounded-xl text-base outline-none"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }} />

      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Peso objetivo: {p.targetWeight} kg</label>
      <input type="range" min="35" max="200" value={p.targetWeight} onChange={(e) => set("targetWeight", +e.target.value)} className="w-full mt-2 mb-4" />

      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Objetivo principal</label>
      <div className="space-y-2 mt-2 mb-4">
        {Object.entries(GOALS).map(([k, v]) => (
          <button key={k} onClick={() => set("goal", k)} className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between"
            style={{ backgroundColor: p.goal === k ? T.ai1 + "18" : "var(--card)", border: `1px solid ${p.goal === k ? T.ai1 : "var(--border)"}` }}>
            <span className="text-sm font-medium">{v.label}</span>
            {p.goal === k && <Check size={16} color={T.ai1} />}
          </button>
        ))}
      </div>

      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Nivel de actividad</label>
      <div className="space-y-2 mt-2 mb-4">
        {Object.entries(ACTIVITY).map(([k, v]) => (
          <button key={k} onClick={() => set("activity", k)} className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between"
            style={{ backgroundColor: p.activity === k ? T.ai1 + "18" : "var(--card)", border: `1px solid ${p.activity === k ? T.ai1 : "var(--border)"}` }}>
            <span className="text-sm font-medium">{v.label}</span>
            {p.activity === k && <Check size={16} color={T.ai1} />}
          </button>
        ))}
      </div>

      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Lugar de entrenamiento</label>
      <div className="flex gap-2 mt-2 mb-4">
        {["casa", "gimnasio", "ambos"].map((s) => (
          <button key={s} onClick={() => set("place", s)} className="flex-1 py-2.5 rounded-xl text-sm font-medium capitalize"
            style={{ backgroundColor: p.place === s ? T.ai1 : "var(--card)", color: p.place === s ? "#fff" : "var(--text)", border: `1px solid ${p.place === s ? T.ai1 : "var(--border)"}` }}>
            {s}
          </button>
        ))}
      </div>

      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--sub)" }}>Equipo disponible</label>
      <div className="flex flex-wrap gap-2 mt-2 mb-6">
        {["Mancuernas", "Barra", "Bandas", "Máquinas", "Ninguno"].map((eq) => (
          <button key={eq} onClick={() => toggleEquip(eq)} className="px-3.5 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: p.equipment.includes(eq) ? T.ai1 : "var(--card)", color: p.equipment.includes(eq) ? "#fff" : "var(--text)", border: `1px solid ${p.equipment.includes(eq) ? T.ai1 : "var(--border)"}` }}>
            {eq}
          </button>
        ))}
      </div>

      <button onClick={save} disabled={saving} className="w-full py-4 rounded-2xl font-medium text-white flex items-center justify-center gap-2"
        style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
        {saving ? <Loader2 size={18} className="animate-spin" /> : "Guardar cambios"}
      </button>
    </div>
  );
}

export function History() {
  const [current, setCurrent] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() + 1 };
  });
  const [daysWithData, setDaysWithData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dayData, setDayData] = useState(null);
  const [loadingDay, setLoadingDay] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await fetch(`/api/calendar?year=${current.year}&month=${current.month}`).then((r) => r.json());
      setDaysWithData(d.days || []);
    })();
  }, [current]);

  useEffect(() => {
    (async () => {
      setLoadingDay(true);
      const d = await fetch(`/api/day?date=${selectedDate}`).then((r) => r.json());
      setDayData(d);
      setLoadingDay(false);
    })();
  }, [selectedDate]);

  const changeMonth = (delta) => {
    setCurrent((c) => {
      let { year, month } = c;
      month += delta;
      if (month < 1) { month = 12; year -= 1; }
      if (month > 12) { month = 1; year += 1; }
      return { year, month };
    });
  };

  const firstOfMonth = new Date(current.year, current.month - 1, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(current.year, current.month, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthLabel = firstOfMonth.toLocaleDateString("es", { month: "long", year: "numeric" });

  const dateStrFor = (d) => `${current.year}-${String(current.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="px-6 pt-2 pb-6" style={{ color: "var(--text)" }}>
      <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>Historial</h2>
      <p className="text-sm mb-5" style={{ color: "var(--sub)" }}>Toca un día para ver lo que registraste</p>

      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeMonth(-1)}><ChevronLeft size={18} color="var(--text)" /></button>
          <span className="text-sm font-semibold capitalize">{monthLabel}</span>
          <button onClick={() => changeMonth(1)}><ChevronRight size={18} color="var(--text)" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
            <div key={i} className="text-center text-xs" style={{ color: "var(--sub)" }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const dateStr = dateStrFor(d);
            const hasData = daysWithData.includes(dateStr);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dateStr)}
                className="aspect-square rounded-xl flex flex-col items-center justify-center relative text-sm"
                style={{
                  backgroundColor: isSelected ? T.ai1 : "transparent",
                  color: isSelected ? "#fff" : isToday ? T.ai1 : "var(--text)",
                  fontWeight: isToday ? 700 : 400,
                  border: isToday && !isSelected ? `1px solid ${T.ai1}` : "1px solid transparent",
                }}
              >
                {d}
                {hasData && !isSelected && (
                  <div className="w-1 h-1 rounded-full absolute bottom-1.5" style={{ backgroundColor: T.protein }} />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {loadingDay ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" color="var(--sub)" /></div>
      ) : dayData && (
        <div>
          <h3 className="text-sm font-semibold mb-3 capitalize" style={{ color: "var(--sub)" }}>
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
          </h3>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card className="text-center py-3">
              <div className="text-lg font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.calories }}>
                {Math.round(dayData.meals.reduce((s, m) => s + (m.totals?.calorias || 0), 0))}
              </div>
              <div className="text-xs" style={{ color: "var(--sub)" }}>kcal</div>
            </Card>
            <Card className="text-center py-3">
              <div className="text-lg font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.water }}>{dayData.water_ml}</div>
              <div className="text-xs" style={{ color: "var(--sub)" }}>ml agua</div>
            </Card>
            <Card className="text-center py-3">
              <div className="text-lg font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.ai1 }}>{dayData.weight ? `${dayData.weight}kg` : "—"}</div>
              <div className="text-xs" style={{ color: "var(--sub)" }}>Peso</div>
            </Card>
          </div>

          {dayData.workouts.length > 0 && (
            <Card className="mb-3">
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--sub)" }}>EJERCICIOS COMPLETADOS</div>
              <div className="flex flex-wrap gap-2">
                {dayData.workouts.map((w, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: T.protein + "1A", color: T.protein }}>{w}</span>
                ))}
              </div>
            </Card>
          )}

          {dayData.meals.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-sm" style={{ color: "var(--sub)" }}>No hay comidas registradas este día.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {dayData.meals.map((m) => (
                <Card key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium">{m.type}</div>
                    <div className="text-xs" style={{ color: "var(--sub)" }}>{(m.items || []).map((f) => f.nombre).join(", ")}</div>
                  </div>
                  <div className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.calories }}>
                    {Math.round(m.totals?.calorias || 0)} kcal
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

