export const TRAINING_LEVELS = {
  base: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export const TRAINING_MINUTES = [25, 40, 60];

export const EQUIPMENT = ["Mancuernas", "Barra", "Bandas", "Máquinas", "Banco", "Barra de dominadas", "Cuerda", "Ninguno"];

export function trainingPreferences(value) {
  const input = value || {};
  const professional = input.professional === true;
  const calories = input.calorieTarget === "" || input.calorieTarget == null ? null : Number(input.calorieTarget);
  return {
    level: Object.hasOwn(TRAINING_LEVELS, input.level) ? input.level : "base",
    minutes: TRAINING_MINUTES.includes(Number(input.minutes)) ? Number(input.minutes) : 40,
    lowImpact: input.lowImpact === true,
    professional,
    calorieTarget: professional && Number.isInteger(calories) && calories > 0 && calories <= 12000 ? calories : null,
  };
}

export function usesProfessionalPlan(profile) {
  return Number(profile.age) < 18 || profile.preferences?.professional === true;
}
