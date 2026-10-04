import cron from "node-cron";
import { prisma } from "../db.js";
import { sendPushToUser } from "./push.js";
import { syncAll } from "./garminSync.js";

// Every morning: nudge anyone whose measurement check-in is due, and pull the latest
// running + body-composition data from Garmin for everyone with a linked account.
export function startCronJobs() {
  cron.schedule("0 7 * * *", async () => {
    const dueReminders = await prisma.measurementReminder.findMany({
      where: { nextDueAt: { lte: new Date() } },
      include: { user: true },
    });
    for (const reminder of dueReminders) {
      await sendPushToUser(reminder.userId, {
        title: "Tid for kroppssjekk",
        body: "Logg vekt, kroppssammensetning og mål for å holde oversikt over progresjonen.",
        url: "/measure",
      }).catch((e) => console.error("Reminder push failed", e));
    }

    const garminAccounts = await prisma.garminAccount.findMany({ select: { userId: true } });
    for (const account of garminAccounts) {
      await syncAll(account.userId).catch((e) => console.error("Daily Garmin sync failed", e));
    }
  });
}
