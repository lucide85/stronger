import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { suggestProgression } from "../services/aiProgression.js";

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth);

sessionsRouter.get("/", async (req: AuthedRequest, res) => {
  const sessions = await prisma.workoutSession.findMany({
    where: { userId: req.userId },
    include: { exercises: { include: { exercise: true, sets: true, suggestion: true } }, programDay: true },
    orderBy: { startedAt: "desc" },
    take: 30,
  });
  res.json(sessions);
});

sessionsRouter.get("/:sessionId", async (req, res) => {
  const session = await prisma.workoutSession.findUnique({
    where: { id: req.params.sessionId },
    include: {
      exercises: {
        include: { exercise: true, sets: { orderBy: { setNumber: "asc" } }, suggestion: true, programExercise: true },
        orderBy: { order: "asc" },
      },
      programDay: true,
    },
  });
  if (!session) return res.status(404).json({ error: "Fant ikke økten" });
  res.json(session);
});

const startSchema = z.object({ programDayId: z.string().optional() });

sessionsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const session = await prisma.workoutSession.create({
    data: { userId: req.userId!, programDayId: parsed.data.programDayId },
  });
  res.status(201).json(session);
});

// Convenience endpoint: start a session for a given program day and pre-populate
// one SessionExercise per planned exercise, in order, ready to log sets against.
sessionsRouter.post("/start-day/:dayId", async (req: AuthedRequest, res) => {
  const day = await prisma.programDay.findUnique({
    where: { id: req.params.dayId },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  if (!day) return res.status(404).json({ error: "Fant ikke treningsdagen" });

  const session = await prisma.workoutSession.create({
    data: {
      userId: req.userId!,
      programDayId: day.id,
      exercises: {
        create: day.exercises.map((pe, i) => ({
          exerciseId: pe.exerciseId,
          programExerciseId: pe.id,
          order: i,
        })),
      },
    },
    include: { exercises: { include: { exercise: true, sets: true, programExercise: true } } },
  });
  res.status(201).json(session);
});

const addExerciseSchema = z.object({
  exerciseId: z.string(),
  programExerciseId: z.string().optional(),
  order: z.number().int().default(0),
});

sessionsRouter.post("/:sessionId/exercises", async (req, res) => {
  const parsed = addExerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const sessionExercise = await prisma.sessionExercise.create({
    data: { workoutSessionId: req.params.sessionId, ...parsed.data },
  });
  res.status(201).json(sessionExercise);
});

const setSchema = z.object({
  setNumber: z.number().int().min(1),
  targetReps: z.number().int().optional(),
  targetWeightKg: z.number().optional(),
  actualReps: z.number().int().min(0),
  actualWeightKg: z.number().min(0),
  rpe: z.number().min(0).max(10).optional(),
});

sessionsRouter.post("/exercises/:sessionExerciseId/sets", async (req, res) => {
  const parsed = setSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const set = await prisma.setLog.create({
    data: { sessionExerciseId: req.params.sessionExerciseId, ...parsed.data },
  });
  res.status(201).json(set);
});

const feedbackSchema = z.object({
  feedback: z.enum(["could_do_more", "on_target", "could_not_complete"]),
  feedbackNote: z.string().optional(),
});

// Submits post-exercise feedback and immediately asks the AI agent for a progression
// suggestion for next time, based on the sets just logged plus the feedback given.
sessionsRouter.post("/exercises/:sessionExerciseId/feedback", async (req, res) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const sessionExercise = await prisma.sessionExercise.update({
    where: { id: req.params.sessionExerciseId },
    data: parsed.data,
    include: { exercise: true, sets: { orderBy: { setNumber: "asc" } }, programExercise: true },
  });

  if (!sessionExercise.programExercise) {
    // Ad-hoc exercise with no program target to progress — nothing to suggest.
    return res.json({ sessionExercise, suggestion: null });
  }

  const pe = sessionExercise.programExercise;
  const suggestion = await suggestProgression({
    exerciseName: sessionExercise.exercise.name,
    progressionScheme: pe.progressionScheme,
    currentTargetSets: pe.targetSets,
    currentRepsMin: pe.targetRepsMin,
    currentRepsMax: pe.targetRepsMax,
    currentWeightKg: pe.targetWeightKg,
    sets: sessionExercise.sets,
    feedback: parsed.data.feedback,
    feedbackNote: parsed.data.feedbackNote,
  });

  const saved = await prisma.progressionSuggestion.upsert({
    where: { sessionExerciseId: sessionExercise.id },
    create: {
      sessionExerciseId: sessionExercise.id,
      programExerciseId: pe.id,
      suggestedSets: suggestion.suggestedSets,
      suggestedRepsMin: suggestion.suggestedRepsMin,
      suggestedRepsMax: suggestion.suggestedRepsMax,
      suggestedWeightKg: suggestion.suggestedWeightKg,
      rationale: suggestion.rationale,
    },
    update: {
      suggestedSets: suggestion.suggestedSets,
      suggestedRepsMin: suggestion.suggestedRepsMin,
      suggestedRepsMax: suggestion.suggestedRepsMax,
      suggestedWeightKg: suggestion.suggestedWeightKg,
      rationale: suggestion.rationale,
      status: "pending",
    },
  });

  res.json({ sessionExercise, suggestion: saved });
});

// Accept a suggestion: writes the new targets back onto the program exercise so
// next time this day comes up, the updated sets/reps/weight are what's prescribed.
sessionsRouter.post("/suggestions/:id/accept", async (req, res) => {
  const suggestion = await prisma.progressionSuggestion.update({
    where: { id: req.params.id },
    data: { status: "accepted", resolvedAt: new Date() },
  });
  if (suggestion.programExerciseId) {
    await prisma.programExercise.update({
      where: { id: suggestion.programExerciseId },
      data: {
        targetSets: suggestion.suggestedSets,
        targetRepsMin: suggestion.suggestedRepsMin,
        targetRepsMax: suggestion.suggestedRepsMax,
        targetWeightKg: suggestion.suggestedWeightKg,
      },
    });
  }
  res.json(suggestion);
});

sessionsRouter.post("/suggestions/:id/reject", async (req, res) => {
  const suggestion = await prisma.progressionSuggestion.update({
    where: { id: req.params.id },
    data: { status: "rejected", resolvedAt: new Date() },
  });
  res.json(suggestion);
});

sessionsRouter.post("/:sessionId/complete", async (req, res) => {
  const session = await prisma.workoutSession.update({
    where: { id: req.params.sessionId },
    data: { completedAt: new Date() },
  });
  res.json(session);
});
