// Enkle strek-figur-illustrasjoner (start/slutt-posisjon) for de viktigste
// sammensatte løftene. To typer poser:
//
// - "angles": en liten kinematisk kjede (hofte → skulder/kne → ankel/albue →
//   hånd) definert ved vinkler fra vertikalen, for stående/hengende øvelser.
// - "fixed": eksplisitte leddpunkter, brukt for liggende øvelser (benkpress,
//   push-ups) der "stående"-kjeden ikke gir mening.
//
// Koordinatsystem: 0-100 i både x og y, y øker nedover (SVG-konvensjon).

export interface Joints {
  head: [number, number];
  shoulder: [number, number];
  elbow: [number, number];
  hand: [number, number];
  hip: [number, number];
  knee: [number, number];
  ankle: [number, number];
}

export interface AnglePose {
  kind: "angles";
  hipX: number;
  hipY: number;
  torso: number; // vinkel fra vertikal ved hofte → skulder (fremoverlent = positiv)
  thigh: number; // vinkel fra vertikal ved hofte → kne
  shin: number; // vinkel fra vertikal ved kne → ankel
  upperArm: number; // vinkel fra vertikal ved skulder → albue
  forearm: number; // vinkel fra vertikal ved albue → hånd
}

export interface FixedPose {
  kind: "fixed";
  head: [number, number];
  shoulder: [number, number];
  elbow: [number, number];
  hand: [number, number];
  hip: [number, number];
  knee: [number, number];
  ankle: [number, number];
}

export type Pose = AnglePose | FixedPose;

const TORSO = 28;
const NECK = 7;
const THIGH = 22;
const SHIN = 22;
const UPPER_ARM = 14;
const FOREARM = 14;

function deg(d: number) {
  return (d * Math.PI) / 180;
}

export function resolvePose(pose: Pose): Joints {
  if (pose.kind === "fixed") {
    const { head, shoulder, elbow, hand, hip, knee, ankle } = pose;
    return { head, shoulder, elbow, hand, hip, knee, ankle };
  }
  const hip: [number, number] = [pose.hipX, pose.hipY];
  const shoulder: [number, number] = [hip[0] + TORSO * Math.sin(deg(pose.torso)), hip[1] - TORSO * Math.cos(deg(pose.torso))];
  const head: [number, number] = [shoulder[0] + NECK * Math.sin(deg(pose.torso)), shoulder[1] - NECK * Math.cos(deg(pose.torso))];
  const knee: [number, number] = [hip[0] + THIGH * Math.sin(deg(pose.thigh)), hip[1] + THIGH * Math.cos(deg(pose.thigh))];
  const ankle: [number, number] = [knee[0] + SHIN * Math.sin(deg(pose.shin)), knee[1] + SHIN * Math.cos(deg(pose.shin))];
  const elbow: [number, number] = [
    shoulder[0] + UPPER_ARM * Math.sin(deg(pose.upperArm)),
    shoulder[1] + UPPER_ARM * Math.cos(deg(pose.upperArm)),
  ];
  const hand: [number, number] = [elbow[0] + FOREARM * Math.sin(deg(pose.forearm)), elbow[1] + FOREARM * Math.cos(deg(pose.forearm))];
  return { head, shoulder, elbow, hand, hip, knee, ankle };
}

export interface PictogramDef {
  label: string;
  start: Pose;
  end: Pose;
  bar?: boolean;
  bench?: boolean;
  floor?: boolean;
}

export const PICTOGRAMS: Record<string, PictogramDef> = {
  squat: {
    label: "Knebøy",
    floor: true,
    start: { kind: "angles", hipX: 50, hipY: 46, torso: 5, thigh: 2, shin: 0, upperArm: 10, forearm: 20 },
    end: { kind: "angles", hipX: 50, hipY: 64, torso: 35, thigh: 65, shin: 8, upperArm: 45, forearm: 70 },
  },
  deadlift: {
    label: "Markløft",
    floor: true,
    bar: true,
    start: { kind: "angles", hipX: 50, hipY: 46, torso: 3, thigh: 3, shin: 0, upperArm: 5, forearm: 8 },
    end: { kind: "angles", hipX: 54, hipY: 60, torso: 62, thigh: 20, shin: -5, upperArm: 28, forearm: 55 },
  },
  "overhead-press": {
    label: "Militærpress",
    floor: true,
    bar: true,
    start: { kind: "angles", hipX: 50, hipY: 48, torso: 0, thigh: 0, shin: 0, upperArm: 90, forearm: 180 },
    end: { kind: "angles", hipX: 50, hipY: 48, torso: 0, thigh: 0, shin: 0, upperArm: 178, forearm: 178 },
  },
  "barbell-row": {
    label: "Stangdrag",
    floor: true,
    bar: true,
    start: { kind: "angles", hipX: 50, hipY: 52, torso: 68, thigh: 12, shin: 0, upperArm: 15, forearm: 20 },
    end: { kind: "angles", hipX: 50, hipY: 52, torso: 68, thigh: 12, shin: 0, upperArm: 95, forearm: 135 },
  },
  "pull-up": {
    label: "Pull-ups",
    bar: true,
    start: { kind: "angles", hipX: 50, hipY: 62, torso: 0, thigh: 2, shin: 0, upperArm: 175, forearm: 175 },
    end: { kind: "angles", hipX: 50, hipY: 50, torso: 2, thigh: 5, shin: 0, upperArm: 140, forearm: 40 },
  },
  dip: {
    label: "Dips",
    start: { kind: "angles", hipX: 50, hipY: 62, torso: 15, thigh: 5, shin: 0, upperArm: 20, forearm: 100 },
    end: { kind: "angles", hipX: 50, hipY: 46, torso: 10, thigh: 5, shin: 0, upperArm: 5, forearm: 10 },
  },
  lunge: {
    label: "Utfall",
    floor: true,
    start: { kind: "angles", hipX: 50, hipY: 46, torso: 3, thigh: 0, shin: 0, upperArm: 10, forearm: 15 },
    end: { kind: "angles", hipX: 55, hipY: 62, torso: 10, thigh: 45, shin: -30, upperArm: 10, forearm: 15 },
  },
  "romanian-deadlift": {
    label: "Rumensk markløft",
    floor: true,
    bar: true,
    start: { kind: "angles", hipX: 50, hipY: 47, torso: 3, thigh: 2, shin: 0, upperArm: 5, forearm: 10 },
    end: { kind: "angles", hipX: 56, hipY: 55, torso: 60, thigh: 10, shin: -5, upperArm: 25, forearm: 55 },
  },
  "bench-press": {
    label: "Benkpress",
    bench: true,
    bar: true,
    start: {
      kind: "fixed",
      head: [20, 64],
      shoulder: [32, 64],
      hip: [58, 64],
      knee: [70, 70],
      ankle: [74, 88],
      elbow: [44, 56],
      hand: [34, 48],
    },
    end: {
      kind: "fixed",
      head: [20, 64],
      shoulder: [32, 64],
      hip: [58, 64],
      knee: [70, 70],
      ankle: [74, 88],
      elbow: [32, 40],
      hand: [32, 26],
    },
  },
  "push-up": {
    label: "Push-ups",
    floor: true,
    start: {
      kind: "fixed",
      head: [20, 58],
      shoulder: [30, 60],
      hip: [55, 63],
      knee: [75, 66],
      ankle: [86, 68],
      elbow: [24, 73],
      hand: [20, 86],
    },
    end: {
      kind: "fixed",
      head: [20, 36],
      shoulder: [30, 38],
      hip: [55, 41],
      knee: [75, 44],
      ankle: [86, 46],
      elbow: [26, 62],
      hand: [20, 86],
    },
  },
};
