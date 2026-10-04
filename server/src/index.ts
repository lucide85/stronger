import "express-async-errors";
import express from "express";
import cors from "cors";
import type { NextFunction, Request, Response } from "express";
import { authRouter } from "./routes/auth.js";
import { exercisesRouter } from "./routes/exercises.js";
import { programsRouter } from "./routes/programs.js";
import { sessionsRouter } from "./routes/sessions.js";
import { runningRouter } from "./routes/running.js";
import { measurementsRouter } from "./routes/measurements.js";
import { pushRouter } from "./routes/push.js";
import { garminRouter } from "./routes/garmin.js";
import { startCronJobs } from "./services/cron.js";

// Last-resort safety net: log and keep the process alive instead of crashing on
// an error that slips outside the Express request cycle (e.g. in the cron jobs).
process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));
process.on("uncaughtException", (err) => console.error("Uncaught exception:", err));

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/programs", programsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/running", runningRouter);
app.use("/api/measurements", measurementsRouter);
app.use("/api/push", pushRouter);
app.use("/api/garmin", garminRouter);

// Catches every error thrown or rejected in a route handler (express-async-errors
// makes async throws reach here too) so one failing request returns a clean 500
// instead of crashing the whole process.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? "Noe gikk galt på serveren" });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`Stronger API listening on :${port}`);
  startCronJobs();
});
