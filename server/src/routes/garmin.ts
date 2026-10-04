import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { encryptSecret } from "../services/crypto.js";
import { syncAll } from "../services/garminSync.js";

export const garminRouter = Router();
garminRouter.use(requireAuth);

garminRouter.get("/status", async (req: AuthedRequest, res) => {
  const account = await prisma.garminAccount.findUnique({ where: { userId: req.userId } });
  if (!account) return res.json({ connected: false });
  res.json({
    connected: true,
    email: account.email,
    lastActivitySyncAt: account.lastActivitySyncAt,
    lastBodyCompSyncAt: account.lastBodyCompSyncAt,
  });
});

const connectSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

garminRouter.post("/connect", async (req: AuthedRequest, res) => {
  const parsed = connectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const account = await prisma.garminAccount.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId!, email: parsed.data.email, encryptedPassword: encryptSecret(parsed.data.password) },
    update: { email: parsed.data.email, encryptedPassword: encryptSecret(parsed.data.password) },
  });
  res.status(201).json({ connected: true, email: account.email });
});

garminRouter.post("/sync", async (req: AuthedRequest, res) => {
  try {
    const result = await syncAll(req.userId!);
    res.json(result);
  } catch (e: any) {
    res.status(502).json({ error: e.message ?? "Synkronisering mot Garmin feilet" });
  }
});
