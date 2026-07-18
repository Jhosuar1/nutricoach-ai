// Tokens de diseño
export const T = {
  bgLight: "#F7F7FB",
  bgDark: "#12131C",
  cardLight: "#FFFFFF",
  cardDark: "#1B1D29",
  borderLight: "#E9E9F2",
  borderDark: "#2A2C3B",
  textLight: "#14151F",
  textDark: "#F3F3F8",
  subLight: "#6B6C7E",
  subDark: "#9496AB",
  ai1: "#7C6CF6",
  ai2: "#4F46E5",
  calories: "#FF6B57",
  protein: "#1FBF9F",
  carbs: "#FFB238",
  fat: "#FF6FA5",
  water: "#4FA8FF",
};

export const ACTIVITY = {
  sedentario: { label: "Sedentario", mult: 1.2 },
  poco_activo: { label: "Poco activo", mult: 1.375 },
  moderado: { label: "Moderadamente activo", mult: 1.55 },
  muy_activo: { label: "Muy activo", mult: 1.725 },
  atleta: { label: "Atleta", mult: 1.9 },
};

export const GOALS = {
  perder_grasa: { label: "Perder grasa", adj: -0.2, proteinPerKg: 2.2 },
  ganar_musculo: { label: "Ganar músculo", adj: 0.12, proteinPerKg: 2.0 },
  mantener: { label: "Mantener peso", adj: 0, proteinPerKg: 1.8 },
  recomposicion: { label: "Recomposición corporal", adj: -0.08, proteinPerKg: 2.2 },
  salud: { label: "Mejorar salud", adj: 0, proteinPerKg: 1.6 },
};

// Mifflin-St Jeor. Acepta valores numéricos o string (Postgres numeric llega como string).
export function calcProfile(p) {
  const weight = Number(p.weight);
  const height = Number(p.height);
  const age = Number(p.age);
  const bmr =
    p.sex === "mujer"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = bmr * ACTIVITY[p.activity].mult;
  const goal = GOALS[p.goal];
  const calories = Math.round(tdee * (1 + goal.adj));
  const protein = Math.round(weight * goal.proteinPerKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const water = Math.round(weight * 35);
  const fiber = Math.round((calories / 1000) * 14);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, protein, carbs, fat, water, fiber };
}

export const bmiCategory = (bmi) => {
  if (bmi < 18.5) return "Bajo peso";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidad";
};

export const MUSCLE_GROUPS = [
  "Cuerpo completo", "Pecho", "Espalda", "Bíceps", "Tríceps",
  "Hombros", "Piernas", "Glúteos", "Abdomen", "Cardio",
];

export const EXERCISES = {
  "Cuerpo completo": [
    { name: "Burpees", sets: 4, reps: "12", rest: "45s", muscles: "Full body" },
    { name: "Sentadilla con salto", sets: 4, reps: "15", rest: "45s", muscles: "Piernas, core" },
    { name: "Flexiones", sets: 3, reps: "15", rest: "45s", muscles: "Pecho, tríceps" },
    { name: "Mountain climbers", sets: 3, reps: "40s", rest: "30s", muscles: "Core, cardio" },
  ],
  Pecho: [
    { name: "Press de banca", sets: 4, reps: "8-10", rest: "90s", muscles: "Pecho, tríceps" },
    { name: "Flexiones inclinadas", sets: 3, reps: "12", rest: "60s", muscles: "Pecho superior" },
    { name: "Aperturas con mancuerna", sets: 3, reps: "12", rest: "60s", muscles: "Pecho" },
  ],
  Espalda: [
    { name: "Dominadas", sets: 4, reps: "6-10", rest: "90s", muscles: "Dorsales, bíceps" },
    { name: "Remo con mancuerna", sets: 4, reps: "10", rest: "75s", muscles: "Espalda media" },
    { name: "Peso muerto", sets: 4, reps: "8", rest: "120s", muscles: "Espalda baja, glúteos" },
  ],
  Bíceps: [
    { name: "Curl con barra", sets: 4, reps: "10", rest: "60s", muscles: "Bíceps" },
    { name: "Curl martillo", sets: 3, reps: "12", rest: "45s", muscles: "Bíceps, antebrazo" },
  ],
  Tríceps: [
    { name: "Press francés", sets: 4, reps: "10", rest: "60s", muscles: "Tríceps" },
    { name: "Fondos en banco", sets: 3, reps: "12", rest: "60s", muscles: "Tríceps" },
  ],
  Hombros: [
    { name: "Press militar", sets: 4, reps: "8-10", rest: "90s", muscles: "Deltoides" },
    { name: "Elevaciones laterales", sets: 3, reps: "15", rest: "45s", muscles: "Deltoides lateral" },
  ],
  Piernas: [
    { name: "Sentadilla libre", sets: 4, reps: "8-10", rest: "120s", muscles: "Cuádriceps, glúteos" },
    { name: "Prensa de piernas", sets: 4, reps: "12", rest: "90s", muscles: "Cuádriceps" },
    { name: "Zancadas", sets: 3, reps: "12 c/pierna", rest: "60s", muscles: "Piernas, glúteos" },
  ],
  Glúteos: [
    { name: "Hip thrust", sets: 4, reps: "12", rest: "75s", muscles: "Glúteos" },
    { name: "Puente de glúteos", sets: 3, reps: "15", rest: "45s", muscles: "Glúteos" },
  ],
  Abdomen: [
    { name: "Plancha", sets: 3, reps: "45s", rest: "30s", muscles: "Core" },
    { name: "Crunch abdominal", sets: 3, reps: "20", rest: "30s", muscles: "Recto abdominal" },
  ],
  Cardio: [
    { name: "Carrera continua", sets: 1, reps: "25 min", rest: "-", muscles: "Cardiovascular" },
    { name: "Salto de cuerda", sets: 5, reps: "2 min", rest: "60s", muscles: "Cardiovascular" },
  ],
};
