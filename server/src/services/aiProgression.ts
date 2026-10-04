import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

export interface SetHistoryEntry {
  setNumber: number;
  targetReps: number | null;
  targetWeightKg: number | null;
  actualReps: number;
  actualWeightKg: number;
  rpe: number | null;
}

export interface ProgressionInput {
  exerciseName: string;
  progressionScheme: string; // "double-progression" | "linear" | "percentage" | "manual"
  currentTargetSets: number;
  currentRepsMin: number;
  currentRepsMax: number;
  currentWeightKg: number;
  sets: SetHistoryEntry[];
  feedback: "could_do_more" | "on_target" | "could_not_complete";
  feedbackNote?: string | null;
  recentSessionsSummary?: string | null; // short text describing the last few sessions on this exercise, if available
}

export interface ProgressionSuggestion {
  suggestedSets: number;
  suggestedRepsMin: number;
  suggestedRepsMax: number;
  suggestedWeightKg: number;
  rationale: string;
}

const SUGGESTION_TOOL = {
  name: "suggest_progression",
  description: "Foreslå sett, repsone og vekt for neste treningsøkt av denne øvelsen.",
  input_schema: {
    type: "object" as const,
    properties: {
      suggestedSets: { type: "integer", minimum: 1, maximum: 10 },
      suggestedRepsMin: { type: "integer", minimum: 1, maximum: 50 },
      suggestedRepsMax: { type: "integer", minimum: 1, maximum: 50 },
      suggestedWeightKg: { type: "number", minimum: 0 },
      rationale: {
        type: "string",
        description: "Kort, konkret begrunnelse (1-2 setninger) på norsk for brukeren.",
      },
    },
    required: ["suggestedSets", "suggestedRepsMin", "suggestedRepsMax", "suggestedWeightKg", "rationale"],
  },
};

const SYSTEM_PROMPT = `Du er en erfaren styrketreningscoach som justerer treningsprogrammer mellom økter.
Du følger fornuftige, konservative progresjonsprinsipper:
- Dobbel-progresjon: øk reps innenfor området først; når toppen av repsintervallet nås på alle sett med god margin, øk vekten og gå tilbake til bunnen av repsintervallet.
- Øk aldri vekt og reps samtidig.
- Typiske vektøkninger er 1.25-2.5 kg for overkropp-isolasjon, 2.5-5 kg for store sammensatte øvelser, aldri mer enn ca 5% av arbeidsvekten i ett hopp.
- Hvis brukeren ikke fullførte målet (feedback "could_not_complete"), hold vekten lik eller reduser den noe (5-10%), og vurder å redusere reps-mål.
- Hvis brukeren fullførte akkurat på mål ("on_target"), progrer forsiktig i tråd med skjemaet.
- Hvis brukeren hadde klart mer ("could_do_more"), progrer tydeligere, men hold deg innenfor fornuftige hopp.
- Ta hensyn til brukerens egen kommentar (feedbackNote) hvis den gir relevant kontekst (f.eks. skade, dårlig søvn, tidspress).
Svar alltid ved å kalle verktøyet suggest_progression med konkrete tall og en kort, konkret begrunnelse på norsk.`;

export async function suggestProgression(input: ProgressionInput): Promise<ProgressionSuggestion> {
  const userPrompt = `Øvelse: ${input.exerciseName}
Progresjonsskjema: ${input.progressionScheme}
Gjeldende mål: ${input.currentTargetSets} sett x ${input.currentRepsMin}-${input.currentRepsMax} reps @ ${input.currentWeightKg} kg

Utførte sett denne økten:
${input.sets
  .map(
    (s) =>
      `  Sett ${s.setNumber}: ${s.actualReps} reps @ ${s.actualWeightKg} kg (mål: ${s.targetReps ?? "-"} reps @ ${
        s.targetWeightKg ?? "-"
      } kg)${s.rpe ? `, RPE ${s.rpe}` : ""}`
  )
  .join("\n")}

Tilbakemelding fra bruker: ${input.feedback}
${input.feedbackNote ? `Kommentar fra bruker: "${input.feedbackNote}"` : ""}
${input.recentSessionsSummary ? `\nNylig historikk:\n${input.recentSessionsSummary}` : ""}

Foreslå sett/reps/vekt for neste økt av denne øvelsen.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [SUGGESTION_TOOL],
    tool_choice: { type: "tool", name: "suggest_progression" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI-agenten returnerte ikke et gyldig forslag");
  }

  return toolUse.input as ProgressionSuggestion;
}
