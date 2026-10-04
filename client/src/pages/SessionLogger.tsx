import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Panel } from "../components/Panel";
import { SetTicks } from "../components/SetTicks";

interface SetLog {
  id: string;
  setNumber: number;
  actualReps: number;
  actualWeightKg: number;
}

interface ProgramExercise {
  id: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetWeightKg: number;
  progressionScheme: string;
}

interface Suggestion {
  id: string;
  suggestedSets: number;
  suggestedRepsMin: number;
  suggestedRepsMax: number;
  suggestedWeightKg: number;
  rationale: string;
  status: string;
}

interface SessionExercise {
  id: string;
  order: number;
  exercise: { id: string; name: string };
  programExercise: ProgramExercise | null;
  sets: SetLog[];
  feedback: string | null;
  suggestion: Suggestion | null;
}

interface Session {
  id: string;
  exercises: SessionExercise[];
}

export function SessionLogger() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(8);
  const [busy, setBusy] = useState(false);

  function reload() {
    apiFetch<Session>(`/sessions/${sessionId}`).then((s) => {
      setSession(s);
      const current = s.exercises[exerciseIndex];
      if (current?.programExercise) {
        setWeight(current.programExercise.targetWeightKg);
        setReps(current.programExercise.targetRepsMax);
      }
    });
  }

  useEffect(reload, [sessionId]);

  const current = session?.exercises[exerciseIndex];
  const pe = current?.programExercise;
  const targetSets = pe?.targetSets ?? 3;

  async function logSet() {
    if (!current) return;
    setBusy(true);
    try {
      await apiFetch(`/sessions/exercises/${current.id}/sets`, {
        method: "POST",
        body: JSON.stringify({
          setNumber: current.sets.length + 1,
          targetReps: pe?.targetRepsMax,
          targetWeightKg: pe?.targetWeightKg,
          actualReps: reps,
          actualWeightKg: weight,
        }),
      });
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function giveFeedback(feedback: "could_do_more" | "on_target" | "could_not_complete") {
    if (!current) return;
    setBusy(true);
    try {
      await apiFetch(`/sessions/exercises/${current.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ feedback }),
      });
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function resolveSuggestion(accept: boolean) {
    if (!current?.suggestion) return;
    await apiFetch(`/sessions/suggestions/${current.suggestion.id}/${accept ? "accept" : "reject"}`, { method: "POST" });
    if (exerciseIndex < (session?.exercises.length ?? 1) - 1) {
      setExerciseIndex(exerciseIndex + 1);
      reload();
    } else {
      await apiFetch(`/sessions/${sessionId}/complete`, { method: "POST" });
      navigate("/strength");
    }
  }

  if (!session || !current) return <div className="p-8 font-mono text-sm text-secondary">Laster økt...</div>;

  return (
    <div className="w-full max-w-[420px] mx-auto px-5 py-6 pb-24 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button className="font-mono text-secondary text-lg" onClick={() => navigate("/strength")}>
          ←
        </button>
        <span className="font-display font-bold tracking-wide">{current.exercise.name.toUpperCase()}</span>
        <span className="font-mono text-xs text-amber">
          {current.sets.length}/{targetSets}
        </span>
      </div>
      <div className="text-center font-mono text-[11px] text-tertiary tracking-widest">
        ØVELSE {exerciseIndex + 1} AV {session.exercises.length}
      </div>

      <div style={{ ["--accent" as any]: "#FF8C42" }}>
        <SetTicks total={targetSets} completed={current.sets.length} current={current.sets.length} />
      </div>

      <div className="flex gap-3.5">
        <Panel accent="#FF8C42" className="flex-1 p-4 flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] text-tertiary tracking-widest">VEKT (KG)</span>
          <span className="font-mono text-4xl font-bold">{weight}</span>
          <div className="flex gap-2">
            <button className="w-9 h-9 border border-hair-bright bg-raised font-mono" onClick={() => setWeight((w) => Math.max(0, w - 2.5))}>
              −
            </button>
            <button className="w-9 h-9 border border-hair-bright bg-raised font-mono" onClick={() => setWeight((w) => w + 2.5)}>
              +
            </button>
          </div>
        </Panel>
        <Panel accent="#FF8C42" className="flex-1 p-4 flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] text-tertiary tracking-widest">REPS</span>
          <span className="font-mono text-4xl font-bold">{reps}</span>
          <div className="flex gap-2">
            <button className="w-9 h-9 border border-hair-bright bg-raised font-mono" onClick={() => setReps((r) => Math.max(0, r - 1))}>
              −
            </button>
            <button className="w-9 h-9 border border-hair-bright bg-raised font-mono" onClick={() => setReps((r) => r + 1)}>
              +
            </button>
          </div>
        </Panel>
      </div>

      {current.sets.length < targetSets && !current.feedback && (
        <button
          disabled={busy}
          className="font-display font-bold uppercase tracking-wide text-sm bg-amber text-[#1A1006] py-4 disabled:opacity-50"
          onClick={logSet}
        >
          LOGG SETT
        </button>
      )}

      {current.sets.length >= targetSets && !current.feedback && (
        <div className="flex flex-col gap-3">
          <div className="h-px bg-hair" />
          <span className="font-mono text-[10.5px] text-tertiary tracking-widest">TILBAKEMELDING</span>
          <span className="font-display text-base font-semibold">Kunne du tatt flere reps?</span>
          <div className="flex gap-2.5">
            <button
              disabled={busy}
              className="flex-1 font-display text-xs font-semibold uppercase border border-hair-bright bg-raised text-secondary py-3"
              onClick={() => giveFeedback("could_do_more")}
            >
              JA, HADDE MER
            </button>
            <button
              disabled={busy}
              className="flex-1 font-display text-xs font-semibold uppercase border border-amber bg-amber text-[#1A1006] py-3"
              onClick={() => giveFeedback("on_target")}
            >
              NEI, DET VAR MAKS
            </button>
          </div>
          <button
            disabled={busy}
            className="font-mono text-[11px] text-danger self-start"
            onClick={() => giveFeedback("could_not_complete")}
          >
            Fikk ikke fullført målet
          </button>
        </div>
      )}

      {current.suggestion && (
        <Panel accent="#3DDAD7" className="p-4 flex gap-2.5 items-start">
          <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded-sm bg-cyan-dim text-cyan">AI</span>
          <div className="font-mono text-xs leading-relaxed text-secondary flex flex-col gap-3">
            <span>
              › Neste økt:{" "}
              <span className="text-primary">
                {current.suggestion.suggestedSets} × {current.suggestion.suggestedRepsMin}-{current.suggestion.suggestedRepsMax} @{" "}
                {current.suggestion.suggestedWeightKg} KG
              </span>
              . {current.suggestion.rationale}
            </span>
            {current.suggestion.status === "pending" && (
              <div className="flex gap-2">
                <button className="flex-1 border border-hair-bright bg-raised text-primary py-2 font-display text-[11px] uppercase" onClick={() => resolveSuggestion(false)}>
                  AVVIS
                </button>
                <button className="flex-1 border border-cyan bg-cyan text-[#06211F] py-2 font-display text-[11px] uppercase" onClick={() => resolveSuggestion(true)}>
                  GODTA → NESTE
                </button>
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
