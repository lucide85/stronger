import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { Panel } from "../components/Panel";

interface Measurement {
  recordedAt: string;
  source: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  bodyWaterPct: number | null;
  waistCm: number | null;
  hipCm: number | null;
  thighCm: number | null;
}

const FIELDS: { key: keyof Measurement; label: string; unit: string }[] = [
  { key: "weightKg", label: "Vekt", unit: "kg" },
  { key: "bodyFatPct", label: "Fettprosent", unit: "%" },
  { key: "muscleMassKg", label: "Muskelmasse", unit: "kg" },
  { key: "bodyWaterPct", label: "Vann", unit: "%" },
  { key: "waistCm", label: "Midje", unit: "cm" },
  { key: "hipCm", label: "Hofte", unit: "cm" },
  { key: "thighCm", label: "Lår", unit: "cm" },
];

export function Measure() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});

  function reload() {
    apiFetch<Measurement[]>("/measurements").then(setMeasurements).catch(() => {});
  }
  useEffect(reload, []);

  const latest = measurements[0];

  async function save() {
    const payload: Record<string, number> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v.trim() !== "") payload[k] = Number(v);
    }
    await apiFetch("/measurements", { method: "POST", body: JSON.stringify(payload) });
    setForm({});
    reload();
  }

  return (
    <div className="max-w-[560px] mx-auto px-5 py-8 pb-24 flex flex-col gap-6">
      <div>
        <div className="font-display text-2xl font-bold tracking-wide text-lime">KROPPSSJEKK</div>
        <div className="font-mono text-[11px] text-tertiary tracking-[0.18em]">MÅL OG SAMMENSETNING</div>
      </div>

      {latest && (
        <Panel accent="#B7FF3C" className="p-5 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-lime" />
          <span className="font-sans text-sm text-secondary">
            Sist logget {new Date(latest.recordedAt).toLocaleDateString("no-NO")}
          </span>
        </Panel>
      )}

      <Panel accent="#B7FF3C" className="p-6 flex flex-col">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex items-center justify-between py-2.5 border-b border-hair last:border-b-0">
            <span className="font-sans text-sm">
              {f.label} <span className="font-mono text-[10px] text-tertiary">{f.unit.toUpperCase()}</span>
            </span>
            <input
              className="w-28 text-right bg-raised border border-hair-bright px-2.5 py-1.5 font-mono text-sm outline-none focus:border-lime"
              type="number"
              step="0.1"
              placeholder={latest?.[f.key] != null ? String(latest[f.key]) : "—"}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <button className="mt-5 font-display font-bold uppercase tracking-wide text-sm bg-lime text-[#101A05] py-3.5" onClick={save}>
          LAGRE SJEKK-IN
        </button>
      </Panel>
    </div>
  );
}
