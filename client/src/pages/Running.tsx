import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { Panel } from "../components/Panel";

interface RunningWorkout {
  id: string;
  type: string;
  source: string;
  startedAt: string;
  durationSeconds: number;
  distanceMeters: number;
  avgPaceSecPerKm: number | null;
  avgHeartRate: number | null;
}

function formatPace(secPerKm: number | null) {
  if (!secPerKm) return "–";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}/km`;
}

export function Running() {
  const [workouts, setWorkouts] = useState<RunningWorkout[]>([]);
  const [distanceKm, setDistanceKm] = useState("5.0");
  const [minutes, setMinutes] = useState("25");
  const [type, setType] = useState("easy");

  function reload() {
    apiFetch<RunningWorkout[]>("/running").then(setWorkouts).catch(() => {});
  }
  useEffect(reload, []);

  async function addRun() {
    const distanceMeters = Number(distanceKm) * 1000;
    const durationSeconds = Number(minutes) * 60;
    await apiFetch("/running", {
      method: "POST",
      body: JSON.stringify({ type, startedAt: new Date().toISOString(), durationSeconds, distanceMeters }),
    });
    reload();
  }

  return (
    <div className="max-w-[700px] mx-auto px-5 py-8 pb-24 flex flex-col gap-6">
      <div>
        <div className="font-display text-2xl font-bold tracking-wide text-cyan">LØPING</div>
        <div className="font-mono text-[11px] text-tertiary tracking-[0.18em]">ØKTER OG FORM</div>
      </div>

      <Panel accent="#3DDAD7" className="p-6 flex flex-col gap-4">
        <span className="font-mono text-xs tracking-widest text-cyan">NY ØKT (MANUELT)</span>
        <div className="flex gap-3 flex-wrap">
          <select className="bg-raised border border-hair-bright px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="easy">Rolig</option>
            <option value="interval">Intervall</option>
            <option value="long">Langtur</option>
            <option value="race">Konkurranse</option>
            <option value="other">Annet</option>
          </select>
          <input
            className="bg-raised border border-hair-bright px-3 py-2 text-sm w-28"
            type="number"
            step="0.1"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            placeholder="KM"
          />
          <input
            className="bg-raised border border-hair-bright px-3 py-2 text-sm w-28"
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="Minutter"
          />
          <button className="font-display text-xs font-bold uppercase bg-cyan text-[#06211F] px-4 py-2" onClick={addRun}>
            LOGGFØR
          </button>
        </div>
      </Panel>

      <div className="flex flex-col gap-3">
        {workouts.map((w) => (
          <Panel key={w.id} className="p-4 flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="font-sans text-sm font-semibold">
                {new Date(w.startedAt).toLocaleDateString("no-NO")} · {w.type.toUpperCase()}
                {w.source === "garmin" && <span className="font-mono text-[9px] text-cyan ml-2">GARMIN</span>}
              </span>
              <span className="font-mono text-xs text-secondary">
                {(w.distanceMeters / 1000).toFixed(2)} KM · {Math.round(w.durationSeconds / 60)} MIN · {formatPace(w.avgPaceSecPerKm)}
              </span>
            </div>
          </Panel>
        ))}
        {workouts.length === 0 && <div className="font-mono text-xs text-tertiary">Ingen løpeøkter logget ennå.</div>}
      </div>
    </div>
  );
}
