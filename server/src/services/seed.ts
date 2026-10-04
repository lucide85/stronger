import { prisma } from "../db.js";
import { EXERCISE_LIBRARY } from "./exerciseLibrary.js";

// Idempotent: only inserts library exercises whose name isn't already a
// global exercise (createdByUserId: null). Safe to run on every boot, and
// new entries added to EXERCISE_LIBRARY later get picked up automatically.
export async function seedExerciseLibrary() {
  const existing = await prisma.exercise.findMany({
    where: { createdByUserId: null },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name));

  const missing = EXERCISE_LIBRARY.filter((e) => !existingNames.has(e.name));
  if (missing.length === 0) return;

  await prisma.exercise.createMany({
    data: missing.map((e) => ({
      name: e.name,
      muscleGroup: e.muscleGroup,
      equipment: e.equipment,
      pictogramKey: e.pictogramKey,
    })),
  });
  console.log(`→ Seedet ${missing.length} øvelser inn i biblioteket`);
}
