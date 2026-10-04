import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { config } from "../config.js";
import { sendPushToUser } from "../services/push.js";

export const pushRouter = Router();
pushRouter.use(requireAuth);

pushRouter.get("/public-key", (_req, res) => {
  res.json({ publicKey: config.push.vapidPublicKey });
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

pushRouter.post("/subscribe", async (req: AuthedRequest, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      userId: req.userId!,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    update: { p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
  });
  res.status(201).json({ ok: true });
});

pushRouter.post("/unsubscribe", async (req, res) => {
  const { endpoint } = req.body as { endpoint?: string };
  if (endpoint) await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  res.json({ ok: true });
});

pushRouter.post("/test", async (req: AuthedRequest, res) => {
  await sendPushToUser(req.userId!, { title: "Stronger", body: "Testvarsel — push fungerer." });
  res.json({ ok: true });
});
