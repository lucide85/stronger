// Standardbibliotek over vanlige styrkeøvelser, kategorisert per muskelgruppe.
// Seedes idempotent ved oppstart (seedExerciseLibrary): kun navn som ikke
// allerede finnes som global øvelse (createdByUserId: null) legges til, så
// det er trygt å kjøre på hver oppstart og å utvide listen senere.
//
// pictogramKey matcher en nøkkel i client/src/data/pictograms.ts — kun satt
// for øvelser som har en start/slutt-illustrasjon.

export interface LibraryExercise {
  name: string;
  muscleGroup: "bryst" | "rygg" | "skuldre" | "biceps" | "triceps" | "bein" | "mage";
  equipment: "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight";
  pictogramKey?: string;
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Bryst
  { name: "Benkpress", muscleGroup: "bryst", equipment: "barbell", pictogramKey: "bench-press" },
  { name: "Skråbenk", muscleGroup: "bryst", equipment: "barbell" },
  { name: "Smalgrep benkpress", muscleGroup: "bryst", equipment: "barbell" },
  { name: "Cable fly", muscleGroup: "bryst", equipment: "cable" },
  { name: "Dumbbell flies", muscleGroup: "bryst", equipment: "dumbbell" },
  { name: "Push-ups", muscleGroup: "bryst", equipment: "bodyweight", pictogramKey: "push-up" },

  // Rygg
  { name: "Markløft", muscleGroup: "rygg", equipment: "barbell", pictogramKey: "deadlift" },
  { name: "Stangdrag", muscleGroup: "rygg", equipment: "barbell", pictogramKey: "barbell-row" },
  { name: "Hantelrow", muscleGroup: "rygg", equipment: "dumbbell" },
  { name: "Nedtrekk", muscleGroup: "rygg", equipment: "cable" },
  { name: "Cable row", muscleGroup: "rygg", equipment: "cable" },
  { name: "Pull-ups", muscleGroup: "rygg", equipment: "bodyweight", pictogramKey: "pull-up" },
  { name: "Rygghev", muscleGroup: "rygg", equipment: "bodyweight" },

  // Skuldre
  { name: "Militærpress", muscleGroup: "skuldre", equipment: "barbell", pictogramKey: "overhead-press" },
  { name: "Dumbbell shoulder press", muscleGroup: "skuldre", equipment: "dumbbell" },
  { name: "Sidehev", muscleGroup: "skuldre", equipment: "dumbbell" },
  { name: "Frontraise", muscleGroup: "skuldre", equipment: "dumbbell" },
  { name: "Bakdelt fly", muscleGroup: "skuldre", equipment: "dumbbell" },
  { name: "Upright row", muscleGroup: "skuldre", equipment: "barbell" },

  // Biceps
  { name: "Bicepscurl", muscleGroup: "biceps", equipment: "barbell" },
  { name: "Hammer curl", muscleGroup: "biceps", equipment: "dumbbell" },
  { name: "Preacher curl", muscleGroup: "biceps", equipment: "barbell" },
  { name: "Konsentrasjonscurl", muscleGroup: "biceps", equipment: "dumbbell" },

  // Triceps
  { name: "Pushdown", muscleGroup: "triceps", equipment: "cable" },
  { name: "Fransk press", muscleGroup: "triceps", equipment: "dumbbell" },
  { name: "Dips", muscleGroup: "triceps", equipment: "bodyweight", pictogramKey: "dip" },
  { name: "Triceps kickback", muscleGroup: "triceps", equipment: "dumbbell" },

  // Bein
  { name: "Knebøy", muscleGroup: "bein", equipment: "barbell", pictogramKey: "squat" },
  { name: "Frontbøy", muscleGroup: "bein", equipment: "barbell" },
  { name: "Beinpress", muscleGroup: "bein", equipment: "machine" },
  { name: "Utfall", muscleGroup: "bein", equipment: "dumbbell", pictogramKey: "lunge" },
  { name: "Rumensk markløft", muscleGroup: "bein", equipment: "barbell", pictogramKey: "romanian-deadlift" },
  { name: "Leg extension", muscleGroup: "bein", equipment: "machine" },
  { name: "Leg curl", muscleGroup: "bein", equipment: "machine" },
  { name: "Tåhev", muscleGroup: "bein", equipment: "machine" },
  { name: "Bulgarian split squat", muscleGroup: "bein", equipment: "dumbbell" },

  // Mage
  { name: "Planke", muscleGroup: "mage", equipment: "bodyweight" },
  { name: "Situps", muscleGroup: "mage", equipment: "bodyweight" },
  { name: "Hengende beinløft", muscleGroup: "mage", equipment: "bodyweight" },
  { name: "Russian twist", muscleGroup: "mage", equipment: "bodyweight" },
  { name: "Cable crunch", muscleGroup: "mage", equipment: "cable" },
  { name: "Ab wheel rollout", muscleGroup: "mage", equipment: "bodyweight" },
];
