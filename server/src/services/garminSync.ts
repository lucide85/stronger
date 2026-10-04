// Pulls running activities and body-composition (scale) data from Garmin Connect,
// the same way the "run, assi, run" app did it: the `garmin-connect` package
// (Pythe1337N/garmin-connect) logs in with an email/password and wraps Garmin's
// unofficial Connect web API. Shapes below are checked against that package's
// published v1.6.2 type declarations (IActivity, WeightData/TotalAverage).
import { GarminConnect } from "garmin-connect";
import { prisma } from "../db.js";
import { decryptSecret } from "./crypto.js";

const clients = new Map<string, GarminConnect>();

async function getClient(userId: string): Promise<GarminConnect> {
  const cached = clients.get(userId);
  if (cached) return cached;

  const account = await prisma.garminAccount.findUnique({ where: { userId } });
  if (!account) throw new Error("Ingen Garmin-konto koblet til denne brukeren");

  const gc = new GarminConnect({ username: account.email, password: decryptSecret(account.encryptedPassword) });
  await gc.login();
  clients.set(userId, gc);
  return gc;
}

export async function syncRunningActivities(userId: string, limit = 20) {
  const gc = await getClient(userId);
  const activities = await gc.getActivities(0, limit);

  let imported = 0;
  for (const activity of activities as any[]) {
    // Garmin's typeKey varies by device/app version ("running", "street_running",
    // "trail_running", "treadmill_running", ...) — match broadly rather than on an
    // exact set.
    const typeKey: string = activity.activityType?.typeKey ?? "";
    if (!typeKey.includes("running")) continue;

    const garminActivityId = String(activity.activityId);
    const exists = await prisma.runningWorkout.findUnique({ where: { garminActivityId } });
    if (exists) continue;

    await prisma.runningWorkout.create({
      data: {
        userId,
        source: "garmin",
        garminActivityId,
        type: typeKey.includes("trail") ? "long" : typeKey.includes("treadmill") ? "easy" : "easy",
        startedAt: new Date(activity.startTimeLocal),
        durationSeconds: Math.round(activity.duration),
        distanceMeters: activity.distance,
        avgPaceSecPerKm:
          activity.distance > 0 ? Math.round(activity.duration / (activity.distance / 1000)) : null,
        avgHeartRate: activity.averageHR ? Math.round(activity.averageHR) : null,
        elevationGainM: activity.elevationGain ?? null,
        rawData: JSON.stringify({
          splits: activity.splitSummaries ?? null,
          cadence: activity.averageRunningCadenceInStepsPerMinute ?? null,
        }),
      },
    });
    imported++;
  }

  await prisma.garminAccount.update({ where: { userId }, data: { lastActivitySyncAt: new Date() } });
  return imported;
}

export async function syncBodyComposition(userId: string, days = 14) {
  const gc = await getClient(userId);
  const today = new Date();
  let imported = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);

    const composition = await gc.getDailyWeightData(date).catch(() => null);
    const avg = composition?.totalAverage;
    if (!avg?.weight) continue;

    const weightKg = avg.weight / 1000;

    const already = await prisma.bodyMeasurement.findFirst({
      where: {
        userId,
        source: "garmin",
        recordedAt: { gte: new Date(dateStr), lt: new Date(date.getTime() + 86400000) },
      },
    });
    if (already) continue;

    await prisma.bodyMeasurement.create({
      data: {
        userId,
        source: "garmin",
        recordedAt: new Date(dateStr),
        weightKg,
        bodyFatPct: avg.bodyFat ?? null,
        muscleMassKg: avg.muscleMass ? avg.muscleMass / 1000 : null,
        bodyWaterPct: avg.bodyWater ?? null,
      },
    });
    imported++;
  }

  await prisma.garminAccount.update({ where: { userId }, data: { lastBodyCompSyncAt: new Date() } });
  return imported;
}

export async function syncAll(userId: string) {
  const [activities, bodyComp] = await Promise.all([
    syncRunningActivities(userId).catch((e) => {
      console.error("Garmin activity sync failed", e);
      return 0;
    }),
    syncBodyComposition(userId).catch((e) => {
      console.error("Garmin body composition sync failed", e);
      return 0;
    }),
  ]);
  return { activitiesImported: activities, bodyMeasurementsImported: bodyComp };
}
