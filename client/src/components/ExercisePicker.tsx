import { useMemo, useState } from "react";
import { ExercisePictogram } from "./ExercisePictogram";

export interface LibraryExercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  pictogramKey: string | null;
}

const GROUPS: { key: string; label: string }[] = [
  { key: "alle", label: "ALLE" },
  { key: "bryst", label: "BRYST" },
  { key: "rygg", label: "RYGG" },
  { key: "skuldre", label: "SKULDRE" },
  { key: "biceps", label: "BICEPS" },
  { key: "triceps", label: "TRICEPS" },
  { key: "bein", label: "BEIN" },
  { key: "mage", label: "MAGE" },
];

export function ExercisePicker({
  exercises,
  value,
  onChange,
  accent = "#FF8C42",
}: {
  exercises: LibraryExercise[];
  value: string;
  onChange: (name: string) => void;
  accent?: string;
}) {
  const [group, setGroup] = useState("alle");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return exercises
      .filter((e) => group === "alle" || e.muscleGroup === group)
      .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, group, search]);

  const selectedExercise = exercises.find((e) => e.name.toLowerCase() === value.trim().toLowerCase());

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-1 flex-wrap">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            onClick={() => setGroup(g.key)}
            className="font-mono text-[9.5px] px-2 py-1 border"
            style={
              group === g.key
                ? { backgroundColor: accent, color: "#1A1006", borderColor: accent }
                : { borderColor: "#333C46", color: "#8A94A3" }
            }
          >
            {g.label}
          </button>
        ))}
      </div>

      <input
        className="bg-raised border border-hair-bright px-3 py-2 text-xs outline-none focus:border-amber"
        placeholder="Søk i biblioteket, eller skriv inn egen øvelse…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        {filtered.map((e) => (
          <button
            key={e.id}
            onClick={() => onChange(e.name)}
            className="font-sans text-xs px-2.5 py-1.5 border"
            style={
              value === e.name
                ? { backgroundColor: accent, color: "#1A1006", borderColor: accent }
                : { borderColor: "#232A32", color: "#ECEFF3", backgroundColor: "#171C23" }
            }
          >
            {e.name}
          </button>
        ))}
        {filtered.length === 0 && <span className="font-mono text-[10px] text-tertiary py-1">Ingen treff — skriv inn egen øvelse under.</span>}
      </div>

      <input
        className="bg-raised border border-hair-bright px-3 py-2 text-sm outline-none focus:border-amber"
        placeholder="Valgt øvelse"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {selectedExercise?.pictogramKey && (
        <div className="bg-panel border border-hair p-3">
          <ExercisePictogram pictogramKey={selectedExercise.pictogramKey} accent={accent} />
        </div>
      )}
    </div>
  );
}
