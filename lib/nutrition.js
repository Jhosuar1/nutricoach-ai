import { trainingPreferences, usesProfessionalPlan } from "./preferences";

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
  if (usesProfessionalPlan(p)) {
    return { mode: "professional", calories: trainingPreferences(p.preferences).calorieTarget };
  }
  const weight = Number(p.weight);
  const height = Number(p.height);
  const age = Number(p.age);
  const bmr =
    p.sex === "mujer"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = bmr * (ACTIVITY[p.activity] ?? ACTIVITY.moderado).mult;
  const goal = GOALS[p.goal] ?? GOALS.mantener;
  const calories = Math.round(tdee * (1 + goal.adj));
  const protein = Math.round(weight * goal.proteinPerKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const water = Math.round(weight * 35);
  const fiber = Math.round((calories / 1000) * 14);
  return { mode: "estimated", bmr: Math.round(bmr), tdee: Math.round(tdee), calories, protein, carbs, fat, water, fiber };
}

export const bmiCategory = (bmi) => {
  if (bmi < 18.5) return "Bajo peso";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidad";
};

// Convierte "90s", "2 min" o "-" a segundos, para el temporizador de descanso.
export function restToSeconds(rest) {
  if (!rest || rest === "-") return 0;
  const min = rest.match(/(\d+)\s*min/);
  if (min) return parseInt(min[1], 10) * 60;
  const sec = rest.match(/(\d+)\s*s/);
  if (sec) return parseInt(sec[1], 10);
  const n = parseInt(rest, 10);
  return isNaN(n) ? 60 : n;
}

export const MUSCLE_GROUPS = [
  "Cuerpo completo", "Pecho", "Espalda", "Bíceps", "Tríceps",
  "Hombros", "Piernas", "Glúteos", "Abdomen", "Cardio",
];

// patron: usado para elegir el diagrama visual genérico del ejercicio.
// Valores: empuje_h, empuje_v, traccion_h, traccion_v, sentadilla, bisagra, core, cardio
export const EXERCISES = {
  "Cuerpo completo": [
    { name: "Burpees", sets: 4, reps: "12", rest: "45s", muscles: "Full body", patron: "cardio",
      pasos: ["Ponte de pie con los pies al ancho de los hombros.", "Baja a cuclillas y apoya las manos en el piso.", "Lanza los pies hacia atrás quedando en posición de plancha.", "Haz una flexión, regresa los pies con un salto y salta hacia arriba."],
      errores: ["Arquear la espalda baja en la plancha.", "Aterrizar el salto con las rodillas rígidas."] },
    { name: "Sentadilla con salto", sets: 4, reps: "15", rest: "45s", muscles: "Piernas, core", patron: "sentadilla",
      pasos: ["Pies al ancho de hombros, baja como una sentadilla normal.", "Impulsa con fuerza hacia arriba saltando.", "Aterriza suave doblando las rodillas.", "Vuelve a bajar de inmediato a la siguiente repetición."],
      errores: ["Aterrizar con las rodillas hacia adentro.", "No amortiguar el aterrizaje."] },
    { name: "Flexiones", sets: 3, reps: "15", rest: "45s", muscles: "Pecho, tríceps", patron: "empuje_h",
      pasos: ["Manos un poco más anchas que los hombros, cuerpo en línea recta.", "Baja el pecho casi hasta el piso doblando los codos.", "Empuja de vuelta arriba manteniendo el core firme."],
      errores: ["Dejar caer la cadera.", "Abrir demasiado los codos hacia los lados."] },
    { name: "Mountain climbers", sets: 3, reps: "40s", rest: "30s", muscles: "Core, cardio", patron: "core",
      pasos: ["En posición de plancha alta, lleva una rodilla al pecho.", "Cambia rápido de pierna como si corrieras en el lugar.", "Mantén la cadera baja y estable todo el tiempo."],
      errores: ["Levantar demasiado la cadera.", "Perder el ritmo y frenar el movimiento."] },
  ],
  Pecho: [
    { name: "Press de banca", sets: 4, reps: "8-10", rest: "90s", muscles: "Pecho, tríceps", patron: "empuje_h",
      pasos: ["Acuéstate en el banco, pies firmes en el piso.", "Agarra la barra un poco más ancho que los hombros.", "Baja controlado hasta rozar el pecho.", "Empuja hacia arriba sin bloquear de golpe los codos."],
      errores: ["Rebotar la barra en el pecho.", "Levantar la cadera del banco."] },
    { name: "Flexiones inclinadas", sets: 3, reps: "12", rest: "60s", muscles: "Pecho superior", patron: "empuje_h",
      pasos: ["Manos sobre una superficie elevada (banco o escalón).", "Cuerpo en línea recta de cabeza a talones.", "Baja el pecho hacia el borde y empuja de vuelta."],
      errores: ["Arquear la espalda baja.", "Usar una superficie demasiado alta, que resta esfuerzo."] },
    { name: "Aperturas con mancuerna", sets: 3, reps: "12", rest: "60s", muscles: "Pecho", patron: "empuje_h",
      pasos: ["Acostado en banco, mancuernas arriba con codos ligeramente flexionados.", "Abre los brazos hacia los lados en arco controlado.", "Vuelve a juntar las mancuernas arriba sin golpear."],
      errores: ["Flexionar demasiado el codo (se vuelve press).", "Bajar demasiado y forzar el hombro."] },
  ],
  Espalda: [
    { name: "Dominadas", sets: 4, reps: "6-10", rest: "90s", muscles: "Dorsales, bíceps", patron: "traccion_v",
      pasos: ["Cuelga de la barra con agarre un poco más ancho que hombros.", "Jala el cuerpo hacia arriba llevando el pecho a la barra.", "Baja controlado hasta extender casi por completo los brazos."],
      errores: ["Usar impulso/balanceo excesivo.", "No completar el rango de bajada."] },
    { name: "Remo con mancuerna", sets: 4, reps: "10", rest: "75s", muscles: "Espalda media", patron: "traccion_h",
      pasos: ["Apoya una rodilla y mano en el banco, espalda recta.", "Jala la mancuerna hacia la cadera, codo pegado al cuerpo.", "Baja controlado sin rotar el torso."],
      errores: ["Rotar el tronco para ayudar el jalón.", "Encoger el hombro en vez de jalar con la espalda."] },
    { name: "Peso muerto", sets: 4, reps: "8", rest: "120s", muscles: "Espalda baja, glúteos", patron: "bisagra",
      pasos: ["Barra pegada a las espinillas, espalda recta, pecho arriba.", "Empuja el piso con los talones y extiende cadera y rodillas juntas.", "Baja controlado llevando la cadera hacia atrás primero."],
      errores: ["Redondear la espalda baja.", "Alejar la barra del cuerpo durante el levantamiento."] },
  ],
  Bíceps: [
    { name: "Curl con barra", sets: 4, reps: "10", rest: "60s", muscles: "Bíceps", patron: "traccion_h",
      pasos: ["De pie, barra con agarre al ancho de hombros.", "Flexiona los codos llevando la barra hacia el pecho.", "Baja controlado sin balancear el cuerpo."],
      errores: ["Usar impulso de cadera/espalda.", "Mover los codos hacia adelante."] },
    { name: "Curl martillo", sets: 3, reps: "12", rest: "45s", muscles: "Bíceps, antebrazo", patron: "traccion_h",
      pasos: ["Mancuernas a los lados con agarre neutro (pulgares arriba).", "Flexiona un brazo o ambos hacia el hombro.", "Baja controlado manteniendo el codo fijo."],
      errores: ["Separar el codo del torso.", "Ir demasiado rápido perdiendo control."] },
  ],
  Tríceps: [
    { name: "Press francés", sets: 4, reps: "10", rest: "60s", muscles: "Tríceps", patron: "empuje_v",
      pasos: ["Acostado, barra o mancuerna arriba con brazos extendidos.", "Baja flexionando solo el codo hasta cerca de la frente.", "Extiende de vuelta sin mover los hombros."],
      errores: ["Mover los codos hacia afuera.", "Bajar demasiado rápido y perder control."] },
    { name: "Fondos en banco", sets: 3, reps: "12", rest: "60s", muscles: "Tríceps", patron: "empuje_v",
      pasos: ["Manos en el borde del banco, piernas extendidas al frente.", "Baja el cuerpo flexionando los codos hacia atrás.", "Empuja de vuelta arriba extendiendo los brazos."],
      errores: ["Bajar demasiado y forzar el hombro.", "Separar demasiado las manos del cuerpo."] },
  ],
  Hombros: [
    { name: "Press militar", sets: 4, reps: "8-10", rest: "90s", muscles: "Deltoides", patron: "empuje_v",
      pasos: ["De pie o sentado, barra o mancuernas a la altura de los hombros.", "Empuja hacia arriba hasta extender los brazos.", "Baja controlado hasta la posición inicial."],
      errores: ["Arquear demasiado la espalda baja.", "No estabilizar el core durante el empuje."] },
    { name: "Elevaciones laterales", sets: 3, reps: "15", rest: "45s", muscles: "Deltoides lateral", patron: "empuje_v",
      pasos: ["De pie, mancuernas a los lados, ligera flexión de codo.", "Eleva los brazos hasta la altura de los hombros.", "Baja controlado sin usar impulso."],
      errores: ["Usar impulso con el cuerpo.", "Subir por encima de la altura del hombro."] },
  ],
  Piernas: [
    { name: "Sentadilla libre", sets: 4, reps: "8-10", rest: "120s", muscles: "Cuádriceps, glúteos", patron: "sentadilla",
      pasos: ["Pies al ancho de hombros, barra sobre los trapecios.", "Baja llevando la cadera hacia atrás y abajo.", "Empuja el piso para volver arriba manteniendo el pecho firme."],
      errores: ["Rodillas hacia adentro al bajar.", "Levantar los talones del piso."] },
    { name: "Prensa de piernas", sets: 4, reps: "12", rest: "90s", muscles: "Cuádriceps", patron: "sentadilla",
      pasos: ["Espalda apoyada, pies al ancho de hombros en la plataforma.", "Baja controlado doblando las rodillas hacia el pecho.", "Empuja sin bloquear las rodillas de golpe."],
      errores: ["Despegar la espalda baja del respaldo.", "Bloquear las rodillas con fuerza al extender."] },
    { name: "Zancadas", sets: 3, reps: "12 c/pierna", rest: "60s", muscles: "Piernas, glúteos", patron: "sentadilla",
      pasos: ["Da un paso largo hacia adelante.", "Baja hasta que ambas rodillas formen 90 grados.", "Empuja con el talón delantero para volver a la posición inicial."],
      errores: ["Que la rodilla delantera pase mucho la punta del pie.", "Perder el equilibrio por pasos demasiado cortos."] },
  ],
  Glúteos: [
    { name: "Hip thrust", sets: 4, reps: "12", rest: "75s", muscles: "Glúteos", patron: "bisagra",
      pasos: ["Espalda apoyada en un banco, barra sobre la cadera.", "Empuja la cadera hacia arriba apretando los glúteos.", "Baja controlado sin arquear la espalda baja."],
      errores: ["Arquear la espalda en vez de usar los glúteos.", "No llegar a la extensión completa de cadera."] },
    { name: "Puente de glúteos", sets: 3, reps: "15", rest: "45s", muscles: "Glúteos", patron: "bisagra",
      pasos: ["Acostado boca arriba, rodillas flexionadas, pies apoyados.", "Empuja la cadera hacia arriba apretando los glúteos arriba.", "Baja controlado sin tocar el piso del todo."],
      errores: ["Usar la espalda baja en vez de los glúteos.", "Subir demasiado rápido sin control."] },
  ],
  Abdomen: [
    { name: "Plancha", sets: 3, reps: "45s", rest: "30s", muscles: "Core", patron: "core",
      pasos: ["Antebrazos y puntas de los pies en el piso.", "Cuerpo en línea recta de cabeza a talones.", "Aprieta el core y sostén sin dejar caer la cadera."],
      errores: ["Levantar demasiado la cadera.", "Dejar caer la cadera y arquear la espalda."] },
    { name: "Crunch abdominal", sets: 3, reps: "20", rest: "30s", muscles: "Recto abdominal", patron: "core",
      pasos: ["Acostado, rodillas flexionadas, manos detrás de la cabeza.", "Sube los hombros del piso contrayendo el abdomen.", "Baja controlado sin tirar del cuello con las manos."],
      errores: ["Jalar el cuello con las manos.", "Hacer el movimiento muy rápido sin control."] },
  ],
  Cardio: [
    { name: "Carrera continua", sets: 1, reps: "25 min", rest: "-", muscles: "Cardiovascular", patron: "cardio",
      pasos: ["Mantén un ritmo constante donde puedas hablar con algo de esfuerzo.", "Pisa de medio pie a talón, sin zancadas exageradas.", "Respira de forma rítmica durante todo el recorrido."],
      errores: ["Empezar demasiado rápido y no poder mantener el ritmo.", "Zancadas muy largas que cargan la rodilla."] },
    { name: "Salto de cuerda", sets: 5, reps: "2 min", rest: "60s", muscles: "Cardiovascular", patron: "cardio",
      pasos: ["Codos pegados al cuerpo, muñecas hacen girar la cuerda.", "Salta lo justo para que pase la cuerda bajo tus pies.", "Aterriza suave sobre la punta de los pies."],
      errores: ["Saltar demasiado alto gastando energía de más.", "Usar todo el brazo en vez de la muñeca."] },
  ],
};
