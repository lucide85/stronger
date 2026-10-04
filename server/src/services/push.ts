import webpush from "web-push";
import { config } from "../config.js";
import { prisma } from "../db.js";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (!config.push.vapidPublicKey || !config.push.vapidPrivateKey) {
    throw new Error("VAPID-nøkler mangler i config.json — kjør `npx web-push generate-vapid-keys` og fyll inn.");
  }
  webpush.setVapidDetails(config.push.vapidSubject, config.push.vapidPublicKey, config.push.vapidPrivateKey);
  configured = true;
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  ensureConfigured();
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error("Push send failed", err);
        }
      }
    })
  );
}
