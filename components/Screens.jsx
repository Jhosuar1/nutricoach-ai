"use client";

import { useState, useRef, useMemo } from "react";
import {
  Camera, Upload, Plus, Check, X, ChevronLeft, Loader2, Sparkles,
  ArrowRight, Scale, Beef, Wheat, Nut, Droplet, Clock, Zap,
  RotateCcw, AlertCircle, Dumbbell, TrendingUp,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { T, ACTIVITY, GOALS, calcProfile, bmiCategory, MUSCLE_GROUPS, EXERCISES } from "@/lib/nutrition";

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
export function AuthScreen({ onAuthed }) {
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
    place: "gimnasio", equipment: [],
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
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const full = reader.result;
      const base64 = full.split(",")[1];
      setImgData({ base64, mediaType: file.type, previewUrl: full });
      setStatus("idle");
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imgData) return;
    setStatus("analyzing");
    try {
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: imgData.base64, mediaType: imgData.mediaType }),
      });
      const parsed = await res.json();
      if (!res.ok || parsed.error) throw new Error(parsed.error || "Error de análisis");
      setResult(parsed);
      setStatus("done");
    } catch (e) {
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

  const reset = () => { setImgData(null); setStatus("idle"); setResult(null); };

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
            <button onClick={() => fileRef.current.click()} className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2" style={{ border: "1px solid var(--border)" }}>
              <Upload size={16} /> Subir
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
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
            <button onClick={analyze} className="w-full py-4 rounded-2xl font-medium text-white flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
              <Sparkles size={18} /> Analizar con IA
            </button>
          )}

          {status === "error" && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: T.calories + "18" }}>
              <AlertCircle size={18} color={T.calories} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">No pudimos analizar la imagen</p>
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
export function Dashboard({ profile, targets, meals, water, onAddWater }) {
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

  return (
    <div className="px-6 pt-2 pb-6" style={{ color: "var(--text)" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm" style={{ color: "var(--sub)" }}>Hola, {profile.name?.split(" ")[0]} 👋</p>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Hoy</h2>
        </div>
      </div>

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
            <div className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: T.calories }}>
              {Math.round(m.totals?.calorias || 0)} kcal
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   WORKOUTS
--------------------------------------------------------- */
export function Workouts({ profile, done, onToggle }) {
  const [group, setGroup] = useState("Cuerpo completo");
  const exercises = EXERCISES[group];

  return (
    <div className="px-6 pt-2 pb-6" style={{ color: "var(--text)" }}>
      <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>Entrenamiento</h2>
      <p className="text-sm mb-5" style={{ color: "var(--sub)" }}>
        {profile.place === "gimnasio" ? "En el gimnasio" : profile.place === "casa" ? "En casa" : "Casa y gimnasio"} · {profile.train_days} días/semana
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {MUSCLE_GROUPS.map((g) => (
          <button key={g} onClick={() => setGroup(g)} className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0"
            style={{ backgroundColor: group === g ? T.ai1 : "transparent", color: group === g ? "#fff" : "var(--text)", border: `1px solid ${group === g ? T.ai1 : "var(--border)"}` }}>
            {g}
          </button>
        ))}
      </div>

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

/* ---------------------------------------------------------
   PROGRESS
--------------------------------------------------------- */
export function Progress({ profile, weightLog, onAddWeight, dark }) {
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
        {chartData.length > 1 ? (
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? T.borderDark : T.borderLight} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: dark ? T.subDark : T.subLight }} />
                <YAxis tick={{ fontSize: 11, fill: dark ? T.subDark : T.subLight }} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip contentStyle={{ backgroundColor: dark ? T.cardDark : T.cardLight, border: `1px solid ${dark ? T.borderDark : T.borderLight}`, borderRadius: 12 }} />
                <Line type="monotone" dataKey="peso" stroke={T.ai1} strokeWidth={2.5} dot={{ r: 3, fill: T.ai1 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm py-6 text-center" style={{ color: "var(--sub)" }}>Registra al menos 2 pesos para ver tu gráfica de evolución</p>
        )}
      </Card>

      <Card>
        <div className="text-sm font-semibold mb-3">Registrar peso de hoy</div>
        <div className="flex gap-3">
          <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(+e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl outline-none" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <button onClick={() => onAddWeight(newWeight)} className="px-5 py-3 rounded-xl font-medium text-white" style={{ background: `linear-gradient(135deg, ${T.ai1}, ${T.ai2})` }}>
            Guardar
          </button>
        </div>
      </Card>
    </div>
  );
}
