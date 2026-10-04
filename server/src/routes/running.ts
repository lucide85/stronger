import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const runningRouter = Router();
runningRouter.use(requireAuth);

runningRouter.get("/", async (req: AuthedRequest, res) => {
  const workouts = await prisma.runningWorkout.findMany({
    where: { userId: req.userId },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  res.json(workouts);
});

const manualSchema = z.object({
  type: z.enum(["easy", "interval", "long", "race", "other"]).default("easy"),
  startedAt: z.coerce.date(),
  durationSeconds: z.number().int().min(1),
  distanceMeters: z.number().min(0),
  avgHeartRate: z.number().int().optional(),
  elevationGainM: z.number().optional(),
  notes: z.string().optional(),
});

runningRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = manualSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { distanceMeters, durationSeconds } = parsed.data;
  const avgPaceSecPerKm = distanceMeters > 0 ? Math.round(durationSeconds / (distanceMeters / 1000)) : null;

  const workout = await prisma.runningWorkout.create({
    data: { ...parsed.data, source: "manual", avgPaceSecPerKm, userId: req.userId! },
  });
  res.status(201).json(workout);
});

runningRouter.delete("/:id", async (req, res) => {
  await prisma.runningWorkout.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
