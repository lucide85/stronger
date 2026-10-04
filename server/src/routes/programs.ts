import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const programsRouter = Router();
programsRouter.use(requireAuth);

programsRouter.get("/", async (req: AuthedRequest, res) => {
  const programs = await prisma.workoutProgram.findMany({
    where: { userId: req.userId },
    include: { days: { include: { exercises: { include: { exercise: true }, orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(programs);
});

const programSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

programsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = programSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const program = await prisma.workoutProgram.create({ data: { ...parsed.data, userId: req.userId! } });
  res.status(201).json(program);
});

const daySchema = z.object({ name: z.string().min(1), order: z.number().int().default(0) });

programsRouter.post("/:programId/days", async (req, res) => {
  const parsed = daySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const day = await prisma.programDay.create({ data: { ...parsed.data, programId: req.params.programId } });
  res.status(201).json(day);
});

const programExerciseSchema = z.object({
  exerciseId: z.string(),
  order: z.number().int().default(0),
  targetSets: z.number().int().min(1),
  targetRepsMin: z.number().int().min(1),
  targetRepsMax: z.number().int().min(1),
  targetWeightKg: z.number().min(0),
  restSeconds: z.number().int().min(0).default(90),
  progressionScheme: z.enum(["double-progression", "linear", "percentage", "manual"]).default("double-progression"),
  notes: z.string().optional(),
});

programsRouter.post("/days/:dayId/exercises", async (req, res) => {
  const parsed = programExerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const programExercise = await prisma.programExercise.create({
    data: { ...parsed.data, programDayId: req.params.dayId },
  });
  res.status(201).json(programExercise);
});

programsRouter.put("/exercises/:id", async (req, res) => {
  const parsed = programExerciseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.programExercise.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
});
