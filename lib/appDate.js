// El "día" de la app no se reinicia a medianoche, se reinicia a la hora en que
// el usuario dijo que se levanta. Si son las 2am y te levantas a las 7am,
// todavía cuenta como el día de ayer.
export function computeAppDate(date, wakeTime) {
  const [wh, wm] = (wakeTime || "07:00").split(":").map((n) => parseInt(n, 10) || 0);
  const wakeToday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), wh, wm, 0);
  const d = new Date(date);
  if (d < wakeToday) {
    d.setDate(d.getDate() - 1);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
