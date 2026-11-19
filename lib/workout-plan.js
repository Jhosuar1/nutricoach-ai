import { EXERCISES, restToSeconds } from "./nutrition";
import { trainingPreferences } from "./preferences";

const requirements = {
  "Press de banca": [["Barra", "Banco"]],
  "Aperturas con mancuerna": [["Mancuernas", "Banco"]],
  "Dominadas": [["Barra de dominadas"]],
  "Remo con mancuerna": [["Mancuernas", "Banco"]],
  "Peso muerto": [["Barra"]],
  "Curl con barra": [["Barra"]],
  "Curl martillo": [["Mancuernas"]],
  "Press francés": [["Barra", "Banco"], ["Mancuernas", "Banco"]],
  "Fondos en banco": [["Banco"]],
  "Press militar": [["Barra"], ["Mancuernas"]],
  "Elevaciones laterales": [["Mancuernas"]],
  "Sentadilla libre": [["Barra"]],
  "Prensa de piernas": [["Máquinas"]],
  "Hip thrust": [["Barra", "Banco"]],
  "Salto de cuerda": [["Cuerda"]],
};

const impact = new Set(["Burpees", "Sentadilla con salto", "Carrera continua", "Salto de cuerda"]);
const advancedOnly = new Set(["Burpees", "Sentadilla con salto", "Dominadas", "Peso muerto", "Sentadilla libre"]);

function exercise(name, muscles, patron, pasos, error, reps = "8–12") {
  return { name, muscles, patron, pasos, errores: [error], sets: 2, reps, rest: "60s" };
}

const walking = exercise("Caminata a ritmo cómodo", "Cardio", "cardio",
  ["Camina en una superficie plana y mantén un ritmo en el que puedas conversar."],
  "Empezar más rápido de lo que puedes sostener.", "10 min");
const wallPush = exercise("Flexiones en pared", "Pecho, tríceps", "empuje_h",
  ["Coloca las manos a la altura del pecho.", "Da un paso atrás, acerca el pecho a la pared y empuja suavemente."],
  "Dejar que la cadera se adelante.");
const chair = exercise("Sentarse y levantarse", "Piernas, glúteos", "sentadilla",
  ["Usa una silla estable, con los pies firmes en el piso.", "Levántate y vuelve a sentarte con control."],
  "Dejarse caer sobre la silla.");
const row = exercise("Retracción escapular de pie", "Espalda alta", "traccion_h",
  ["Con los codos doblados y cerca del cuerpo, lleva los hombros suavemente hacia atrás y regresa."],
  "Encoger los hombros hacia las orejas.");

const basics = {
  "Cuerpo completo": [chair, wallPush, row, EXERCISES.Glúteos[1]],
  Pecho: [wallPush],
  Espalda: [row],
  Bíceps: [exercise("Curl con resistencia de la otra mano", "Bíceps", "traccion_h",
    ["Acerca una mano al hombro mientras la otra mano ofrece resistencia suave.", "Baja despacio y cambia de brazo."],
    "Balancear el tronco.", "8–12 por lado")],
  Tríceps: [exercise("Flexiones cerradas en pared", "Tríceps", "empuje_h",
    ["Apoya las manos frente al pecho, con un agarre cómodo.", "Dobla los codos cerca del cuerpo y vuelve a empujar."],
    "Forzar el movimiento al final del recorrido.")],
  Hombros: [exercise("Elevación de brazos sin carga", "Hombros", "empuje_v",
    ["Eleva los brazos lentamente hasta una altura cómoda y bájalos con control."],
    "Forzar una altura que produce molestia.")],
  Piernas: [chair],
  Glúteos: [EXERCISES.Glúteos[1]],
  Abdomen: [exercise("Talones alternados acostado", "Abdomen", "core",
    ["Acuéstate boca arriba y dobla las rodillas.", "Aleja un talón por el piso, vuelve y cambia de lado."],
    "Arquear la zona lumbar.", "8–12 por lado")],
  Cardio: [walking],
};

const bandRow = exercise("Remo sentado con banda", "Espalda media", "traccion_h",
  ["Siéntate y coloca una banda en buen estado alrededor de tus pies.", "Sujeta los extremos y lleva los codos atrás sin inclinar el torso."],
  "Soltar la banda mientras está tensa.");

const fullBody = [
  ...EXERCISES.Piernas, ...EXERCISES.Pecho, ...EXERCISES.Espalda,
  ...EXERCISES.Glúteos, ...EXERCISES.Abdomen, ...EXERCISES["Cuerpo completo"],
];

export function workoutFor(profile, group) {
  const prefs = trainingPreferences(profile.preferences);
  const equipment = new Set(Array.isArray(profile.equipment) ? profile.equipment : []);
  if (profile.place === "casa") equipment.delete("Máquinas");
  const catalog = group === "Cuerpo completo" ? fullBody : (EXERCISES[group] || []);
  const candidates = equipment.has("Bandas") && ["Cuerpo completo", "Espalda"].includes(group)
    ? [bandRow, ...catalog] : catalog;
  const compatible = candidates.filter(item =>
    (!prefs.lowImpact || !impact.has(item.name)) &&
    (prefs.level !== "base" || (!advancedOnly.has(item.name) && !impact.has(item.name))) &&
    (!requirements[item.name] || requirements[item.name].some(option => option.every(gear => equipment.has(gear)))));
  const sets = prefs.level === "base" ? 2 : prefs.level === "intermedio" ? 3 : profile.goal === "ganar_musculo" ? 4 : 3;
  const max = prefs.minutes === 25 ? 3 : prefs.minutes === 40 ? 4 : 6;
  const ranked = [...new Map([
    ...(prefs.level === "base" || !compatible.length ? basics[group] || [] : []),
    ...compatible,
    ...(basics[group] || []),
  ].map(item => [item.name, item])).values()];
  const plan = [];
  const budget = Math.max(1, prefs.minutes - 5) * 60;
  let used = 0;
  while (ranked.length && plan.length < max) {
    // Una vez elegido un patrón, prioriza uno distinto para repartir el trabajo.
    const different = ranked.findIndex(item => !plan.some(entry => entry.patron === item.patron));
    const [item] = ranked.splice(different < 0 ? 0 : different, 1);
    const timed = /\d\s*(s|min)\b/.test(item.reps);
    const count = timed ? (group === "Cardio" ? Math.min(item.sets, prefs.level === "base" ? 2 : 3) : Math.min(sets, 3)) : sets;
    const cardioMinutes = timed && item.reps.includes("min") && item.sets === 1
      ? Math.min(restToSeconds(item.reps) / 60, prefs.minutes - 5) : null;
    const reps = timed ? (cardioMinutes ? `${cardioMinutes} min` : item.reps) : prefs.level === "base" ? "6–10" :
      profile.goal === "ganar_musculo" ? "8–12" : "8–15";
    const rest = item.rest === "-" ? "-" : `${Math.max(restToSeconds(item.rest), prefs.level === "base" ? 60 : 75)}s`;
    const workAndRest = count * (timed ? restToSeconds(reps) : 45) + (count - 1) * restToSeconds(rest) + 30;
    if (plan.length && used + workAndRest > budget) continue;
    plan.push({ ...item, sets: count, reps: /por lado|c\/pierna/.test(item.reps) ? `${reps} por lado` : reps, rest });
    used += workAndRest;
  }
  return plan;
}
