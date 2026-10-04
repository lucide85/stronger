import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const measurementsRouter = Router();
measurementsRouter.use(requireAuth);

measurementsRouter.get("/", async (req: AuthedRequest, res) => {
  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId: req.userId },
    orderBy: { recordedAt: "desc" },
    take: 100,
  });
  res.json(measurements);
});

measurementsRouter.get("/reminder", async (req: AuthedRequest, res) => {
  const reminder = await prisma.measurementReminder.findUnique({ where: { userId: req.userId } });
  res.json(reminder);
});

const reminderSchema = z.object({ intervalDays: z.number().int().min(1).max(120) });

measurementsRouter.put("/reminder", async (req: AuthedRequest, res) => {
  const parsed = reminderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const nextDueAt = new Date(Date.now() + parsed.data.intervalDays * 24 * 60 * 60 * 1000);
  const reminder = await prisma.measurementReminder.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId!, intervalDays: parsed.data.intervalDays, nextDueAt },
    update: { intervalDays: parsed.data.intervalDays },
  });
  res.json(reminder);
});

const measurementSchema = z.object({
  weightKg: z.number().optional(),
  bodyFatPct: z.number().optional(),
  muscleMassKg: z.number().optional(),
  bodyWaterPct: z.number().optional(),
  waistCm: z.number().optional(),
  hipCm: z.number().optional(),
  thighCm: z.number().optional(),
  armCm: z.number().optional(),
  chestCm: z.number().optional(),
  notes: z.string().optional(),
});

measurementsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = measurementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const measurement = await prisma.bodyMeasurement.create({
    data: { ...parsed.data, source: "manual", userId: req.userId! },
  });

  const interval = (await prisma.measurementReminder.findUnique({ where: { userId: req.userId! } }))?.intervalDays ?? 14;
  const nextDueAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
  await prisma.measurementReminder.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId!, intervalDays: interval, lastRemindedAt: new Date(), nextDueAt },
    update: { lastRemindedAt: new Date(), nextDueAt },
  });

  res.status(201).json(measurement);
});
