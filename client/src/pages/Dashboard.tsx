import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Panel } from "../components/Panel";

interface RunningWorkout {
  distanceMeters: number;
  startedAt: string;
  avgPaceSecPerKm: number | null;
}

interface BodyMeasurement {
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
}

interface GarminStatus {
  connected: boolean;
  lastActivitySyncAt?: string | null;
}

function formatPace(secPerKm: number | null) {
  if (!secPerKm) return "–";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")} / km`;
}

export function Dashboard() {
  const [running, setRunning] = useState<RunningWorkout[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [garmin, setGarmin] = useState<GarminStatus | null>(null);

  useEffect(() => {
    apiFetch<RunningWorkout[]>("/running").then(setRunning).catch(() => {});
    apiFetch<BodyMeasurement[]>("/measurements").then(setMeasurements).catch(() => {});
    apiFetch<GarminStatus>("/garmin/status").then(setGarmin).catch(() => {});
  }, []);

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekRuns = running.filter((r) => Date.now() - new Date(r.startedAt).getTime() < weekMs);
  const weekDistanceKm = weekRuns.reduce((sum, r) => sum + r.distanceMeters, 0) / 1000;
  const avgPace =
    weekRuns.length > 0
      ? weekRuns.reduce((sum, r) => sum + (r.avgPaceSecPerKm ?? 0), 0) / weekRuns.filter((r) => r.avgPaceSecPerKm).length
      : null;

  const latest = measurements[0];
  const previous = measurements[1];
  const weightDelta = latest?.weightKg && previous?.weightKg ? latest.weightKg - previous.weightKg : null;

  return (
    <div className="max-w-[1360px] mx-auto px-5 py-8 pb-24 flex flex-col gap-7">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="font-display text-2xl font-bold tracking-wide">STRONGER</div>
          <div className="font-mono text-[11px] text-tertiary tracking-[0.18em]">PERFORMANCE LOG</div>
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Panel accent="#FF8C42" className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs tracking-widest text-amber">STYRKE</span>
            <Link to="/strength" className="font-mono text-[10px] text-tertiary">
              ÅPNE →
            </Link>
          </div>
          <div className="font-mono text-3xl font-bold">
            {running.length === 0 ? "–" : "+5.0"} <span className="text-sm text-secondary">KG</span>
          </div>
          <div className="font-mono text-[11px] text-secondary">VOLUMTREND DENNE UKEN</div>
        </Panel>

        <Panel accent="#3DDAD7" className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs tracking-widest text-cyan">LØPING</span>
            <Link to="/running" className="font-mono text-[10px] text-tertiary">
              ÅPNE →
            </Link>
          </div>
          <div className="font-mono text-3xl font-bold">
            {weekDistanceKm.toFixed(1)} <span className="text-sm text-secondary">KM</span>
          </div>
          <div className="font-mono text-[11px] text-secondary">SNITT {formatPace(avgPace)}</div>
        </Panel>

        <Panel accent="#B7FF3C" className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs tracking-widest text-lime">KROPP</span>
            <Link to="/measure" className="font-mono text-[10px] text-tertiary">
              ÅPNE →
            </Link>
          </div>
          <div className="font-mono text-3xl font-bold">
            {latest?.weightKg?.toFixed(1) ?? "–"} <span className="text-sm text-secondary">KG</span>
          </div>
          <div className="font-mono text-[11px] text-lime">
            {weightDelta != null ? `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} KG SIDEN SIST` : "INGEN HISTORIKK ENNÅ"}
          </div>
        </Panel>
      </div>

      <div className="flex gap-6 flex-wrap">
        <Panel accent="#FF8C42" className="p-7 flex flex-col gap-4" style={{ flex: "999 1 560px", minWidth: 0 }}>
          <div className="flex justify-between items-baseline">
            <span className="font-display text-lg font-bold">DAGENS ØKT</span>
            <Link to="/strength" className="font-mono text-xs text-amber">
              START ØKT →
            </Link>
          </div>
          <div className="font-sans text-sm text-secondary">
            Ingen aktiv økt planlagt enda. Legg inn et program under Styrke for å komme i gang.
          </div>
        </Panel>

        <div className="flex flex-col gap-5" style={{ flex: "1 1 280px", minWidth: 260 }}>
          <Panel accent="#B7FF3C" className="p-5 flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-wider text-lime">NESTE MÅLING</span>
            <Link to="/measure" className="font-mono text-xs text-lime mt-2">
              LOGGFØR NÅ →
            </Link>
          </Panel>

          <Panel className="p-5 flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-wider text-secondary">GARMIN SYNC</span>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${garmin?.connected ? "bg-lime" : "bg-hair-bright"}`} />
              <span className="font-mono text-xs text-secondary">
                {garmin?.connected
                  ? garmin.lastActivitySyncAt
                    ? `Sist synket ${new Date(garmin.lastActivitySyncAt).toLocaleString("no-NO")}`
                    : "Koblet til, venter på første synk"
                  : "Ikke koblet til"}
              </span>
            </div>
            <Link to="/settings" className="font-mono text-[11px] text-cyan">
              {garmin?.connected ? "OPPDATER →" : "KOBLE TIL →"}
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}
