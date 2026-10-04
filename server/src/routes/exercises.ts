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
