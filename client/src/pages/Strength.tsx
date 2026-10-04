import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Panel } from "../components/Panel";

interface Exercise {
  id: string;
  name: string;
}

interface ProgramExercise {
  id: string;
  exercise: Exercise;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetWeightKg: number;
}

interface ProgramDay {
  id: string;
  name: string;
  exercises: ProgramExercise[];
}

interface Program {
  id: string;
  name: string;
  days: ProgramDay[];
}

const inputClass =
  "bg-raised border border-hair-bright px-3 py-2 text-sm outline-none focus:border-amber";
const smallBtnClass = "font-display text-[11px] font-bold uppercase px-3 py-2";

export function Strength() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newProgramName, setNewProgramName] = useState("");
  const [busy, setBusy] = useState(false);

  const [dayFormFor, setDayFormFor] = useState<string | null>(null);
  const [dayName, setDayName] = useState("");

  const [exerciseFormFor, setExerciseFormFor] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("3");
  const [repsMin, setRepsMin] = useState("8");
  const [repsMax, setRepsMax] = useState("12");
  const [weight, setWeight] = useState("20");

  function reload() {
    apiFetch<Program[]>("/programs").then(setPrograms).catch(() => {});
    apiFetch<Exercise[]>("/exercises").then(setExercises).catch(() => {});
  }

  useEffect(reload, []);

  async function createProgram() {
    if (!newProgramName.trim()) return;
    setBusy(true);
    try {
      await apiFetch("/programs", { method: "POST", body: JSON.stringify({ name: newProgramName }) });
      setNewProgramName("");
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function submitDay(programId: string) {
    if (!dayName.trim()) return;
    await apiFetch(`/programs/${programId}/days`, { method: "POST", body: JSON.stringify({ name: dayName, order: 0 }) });
    setDayName("");
    setDayFormFor(null);
    reload();
  }

  async function submitExercise(dayId: string) {
    if (!exerciseName.trim()) return;
    const existing = exercises.find((e) => e.name.toLowerCase() === exerciseName.trim().toLowerCase());
    const exerciseId = existing
      ? existing.id
      : (await apiFetch<Exercise>("/exercises", { method: "POST", body: JSON.stringify({ name: exerciseName.trim() }) })).id;

    await apiFetch(`/programs/days/${dayId}/exercises`, {
      method: "POST",
      body: JSON.stringify({
        exerciseId,
        order: 0,
        targetSets: Number(sets) || 1,
        targetRepsMin: Number(repsMin) || 1,
        targetRepsMax: Number(repsMax) || 1,
        targetWeightKg: Number(weight) || 0,
      }),
    });
    setExerciseName("");
    setSets("3");
    setRepsMin("8");
    setRepsMax("12");
    setWeight("20");
    setExerciseFormFor(null);
    reload();
  }

  async function startSession(dayId: string) {
    const session = await apiFetch<{ id: string }>(`/sessions/start-day/${dayId}`, { method: "POST" });
    navigate(`/strength/session/${session.id}`);
  }

  return (
    <div className="max-w-[900px] mx-auto px-5 py-8 pb-24 flex flex-col gap-6">
      <div>
        <div className="font-display text-2xl font-bold tracking-wide">STYRKE</div>
        <div className="font-mono text-[11px] text-tertiary tracking-[0.18em]">PROGRAM OG ØKTER</div>
      </div>

      {programs.map((program) => (
        <Panel key={program.id} accent="#FF8C42" className="p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <span className="font-display text-lg font-bold">{program.name}</span>
            <button
              className="font-mono text-[11px] text-amber"
              onClick={() => setDayFormFor(dayFormFor === program.id ? null : program.id)}
            >
              + TRENINGSDAG
            </button>
          </div>

          {dayFormFor === program.id && (
            <div className="flex gap-2">
              <input
                autoFocus
                className={`flex-1 ${inputClass}`}
                placeholder="F.eks. Push A"
                value={dayName}
                onChange={(e) => setDayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitDay(program.id)}
              />
              <button className={`${smallBtnClass} bg-amber text-[#1A1006]`} onClick={() => submitDay(program.id)}>
                LAGRE
              </button>
            </div>
          )}

          {program.days.map((day) => (
            <div key={day.id} className="border-t border-hair pt-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-sans text-sm font-semibold">{day.name}</span>
                <div className="flex gap-4">
                  <button
                    className="font-mono text-[11px] text-secondary"
                    onClick={() => setExerciseFormFor(exerciseFormFor === day.id ? null : day.id)}
                  >
                    + ØVELSE
                  </button>
                  {day.exercises.length > 0 && (
                    <button className="font-mono text-[11px] text-amber" onClick={() => startSession(day.id)}>
                      START ØKT →
                    </button>
                  )}
                </div>
              </div>

              {day.exercises.map((pe) => (
                <div key={pe.id} className="flex justify-between font-mono text-xs text-secondary">
                  <span>{pe.exercise.name}</span>
                  <span>
                    {pe.targetSets} × {pe.targetRepsMin}-{pe.targetRepsMax} @ {pe.targetWeightKg} KG
                  </span>
                </div>
              ))}

              {exerciseFormFor === day.id && (
                <div className="flex flex-col gap-2 bg-raised border border-hair-bright p-3">
                  <input
                    autoFocus
                    list="exercise-options"
                    className={inputClass}
                    placeholder="Øvelsesnavn"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                  />
                  <datalist id="exercise-options">
                    {exercises.map((e) => (
                      <option key={e.id} value={e.name} />
                    ))}
                  </datalist>
                  <div className="flex gap-2">
                    <input
                      className={`${inputClass} w-20`}
                      type="number"
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                      aria-label="Antall sett"
                    />
                    <span className="font-mono text-xs text-tertiary self-center">SETT</span>
                    <input
                      className={`${inputClass} w-16`}
                      type="number"
                      value={repsMin}
                      onChange={(e) => setRepsMin(e.target.value)}
                      aria-label="Min reps"
                    />
                    <span className="font-mono text-xs text-tertiary self-center">–</span>
                    <input
                      className={`${inputClass} w-16`}
                      type="number"
                      value={repsMax}
                      onChange={(e) => setRepsMax(e.target.value)}
                      aria-label="Maks reps"
                    />
                    <span className="font-mono text-xs text-tertiary self-center">REPS</span>
                    <input
                      className={`${inputClass} w-20`}
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      aria-label="Startvekt"
                    />
                    <span className="font-mono text-xs text-tertiary self-center">KG</span>
                  </div>
                  <button className={`${smallBtnClass} bg-amber text-[#1A1006] self-start`} onClick={() => submitExercise(day.id)}>
                    LEGG TIL ØVELSE
                  </button>
                </div>
              )}
            </div>
          ))}
        </Panel>
      ))}

      <Panel className="p-6 flex gap-3 items-center">
        <input
          className={`flex-1 ${inputClass}`}
          placeholder="Nytt program, f.eks. Push/Pull/Legs"
          value={newProgramName}
          onChange={(e) => setNewProgramName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createProgram()}
        />
        <button disabled={busy} className={`${smallBtnClass} bg-amber text-[#1A1006]`} onClick={createProgram}>
          OPPRETT
        </button>
      </Panel>
    </div>
  );
}
