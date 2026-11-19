import { TRAINING_LEVELS, TRAINING_MINUTES } from "@/lib/preferences";

const field = "w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-base";

export default function PlanPreferences({ preferences, onChange, isMinor }) {
  const set = (field, value) => onChange({ ...preferences, [field]: value });
  return <fieldset className="mb-4 grid gap-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4">
    <legend className="px-2 text-sm font-semibold">Personaliza tu plan</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">Experiencia de entrenamiento
        <select className={field} value={preferences.level} onChange={event => set("level", event.target.value)}>
          {Object.entries(TRAINING_LEVELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Tiempo por sesión
        <select className={field} value={preferences.minutes} onChange={event => set("minutes", Number(event.target.value))}>
          {TRAINING_MINUTES.map(value => <option key={value} value={value}>{value} minutos</option>)}
        </select>
      </label>
    </div>
    <label className="flex items-start gap-2 text-sm">
      <input className="mt-1" type="checkbox" checked={preferences.lowImpact} onChange={event => set("lowImpact", event.target.checked)} />
      Prefiero evitar saltos y carrera
    </label>
    <div className="grid gap-2 border-t border-[var(--border)] pt-3">
      <label className="flex items-start gap-2 text-sm font-semibold">
        <input className="mt-1" type="checkbox" checked={preferences.professional}
          onChange={event => set("professional", event.target.checked)} />
        Usar seguimiento sin recomendaciones automáticas
      </label>
      <p className="text-sm text-[var(--sub)]">Si tienes indicaciones de salud, registra tu meta diaria profesional o deja la meta vacía. No hace falta ingresar diagnósticos ni información genética.</p>
      {isMinor && <p className="text-sm">Antes de los 18 años, las metas estimadas y las rutinas automáticas quedan desactivadas.</p>}
      {preferences.professional && <label className="grid gap-1 text-sm">Meta indicada por un profesional (kcal/día)
        <input className={field} type="number" min={1} max={12000} step={1}
          value={preferences.calorieTarget ?? ""} placeholder="Opcional" onChange={event => set("calorieTarget", event.target.value)} />
      </label>}
    </div>
  </fieldset>;
}
