import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const exercisesRouter = Router();
exercisesRouter.use(requireAuth);

exercisesRouter.get("/", async (_req, res) => {
  const exercises = await prisma.exercise.findMany({ orderBy: { name: "asc" } });
  res.json(exercises);
});

// Per-session progression history for one exercise: max weight and total
// volume lifted each time it was logged, oldest first — what the strength
// trend chart plots.
exercisesRouter.get("/:id/history", async (req: AuthedRequest, res) => {
  const sets = await prisma.setLog.findMany({
    where: {
      sessionExercise: {
        exerciseId: req.params.id,
        workoutSession: { userId: req.userId },
      },
    },
    include: { sessionExercise: { include: { workoutSession: true } } },
    orderBy: { completedAt: "asc" },
  });

  const bySession = new Map<string, { date: Date; maxWeightKg: number; totalVolumeKg: number; sets: number }>();
  for (const set of sets) {
    const sessionId = set.sessionExercise.workoutSessionId;
    const date = set.sessionExercise.workoutSession.startedAt;
    const entry = bySession.get(sessionId) ?? { date, maxWeightKg: 0, totalVolumeKg: 0, sets: 0 };
    entry.maxWeightKg = Math.max(entry.maxWeightKg, set.actualWeightKg);
    entry.totalVolumeKg += set.actualWeightKg * set.actualReps;
    entry.sets += 1;
    bySession.set(sessionId, entry);
  }

  const history = [...bySession.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  res.json(history);
});

const exerciseSchema = z.object({
  name: z.string().min(1),
  muscleGroup: z.string().optional(),
  equipment: z.string().optional(),
  notes: z.string().optional(),
});

exercisesRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = exerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const exercise = await prisma.exercise.create({
    data: { ...parsed.data, createdByUserId: req.userId },
  });
  res.status(201).json(exercise);
});

exercisesRouter.put("/:id", async (req, res) => {
  const parsed = exerciseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const exercise = await prisma.exercise.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(exercise);
});

exercisesRouter.delete("/:id", async (req, res) => {
  await prisma.exercise.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
