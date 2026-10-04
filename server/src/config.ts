import fs from "node:fs";
import path from "node:path";

export interface AppConfig {
  anthropicApiKey: string;
  push: { vapidPublicKey: string; vapidPrivateKey: string; vapidSubject: string };
  sessionSecret: string;
  measurementReminderDays: number;
}

const configPath = path.resolve(process.cwd(), "..", "config.json");
const fallbackPath = path.resolve(process.cwd(), "config.json");

function loadFile(): Partial<AppConfig> {
  const p = fs.existsSync(configPath) ? configPath : fallbackPath;
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

const fromFile = loadFile();

export const config: AppConfig = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? fromFile.anthropicApiKey ?? "",
  push: {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? fromFile.push?.vapidPublicKey ?? "",
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? fromFile.push?.vapidPrivateKey ?? "",
    vapidSubject: process.env.VAPID_SUBJECT ?? fromFile.push?.vapidSubject ?? "mailto:admin@example.com",
  },
  sessionSecret: process.env.SESSION_SECRET ?? fromFile.sessionSecret ?? "dev-secret-change-me",
  measurementReminderDays: Number(process.env.MEASUREMENT_REMINDER_DAYS ?? fromFile.measurementReminderDays ?? 14),
};
