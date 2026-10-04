import { PICTOGRAMS, resolvePose, type Joints } from "../data/pictograms";

function Figure({ joints, accent, bar, bench, floor }: { joints: Joints; accent: string; bar?: boolean; bench?: boolean; floor?: boolean }) {
  const { head, shoulder, elbow, hand, hip, knee, ankle } = joints;
  const line = (a: [number, number], b: [number, number]) => (
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
  );
  return (
    <>
      {floor && <line x1={5} y1={92} x2={95} y2={92} stroke="currentColor" strokeWidth={1} opacity={0.25} />}
      {bench && <rect x={28} y={64} width={46} height={7} fill="currentColor" opacity={0.18} />}
      {line(shoulder, hip)}
      {line(hip, knee)}
      {line(knee, ankle)}
      {line(shoulder, elbow)}
      {line(elbow, hand)}
      {line(shoulder, head)}
      <circle cx={head[0]} cy={head[1]} r={5} fill={accent} />
      {bar && (
        <line
          x1={hand[0] - 14}
          y1={hand[1]}
          x2={hand[0] + 14}
          y2={hand[1]}
          stroke={accent}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.85}
        />
      )}
    </>
  );
}

export function ExercisePictogram({ pictogramKey, accent = "#FF8C42" }: { pictogramKey: string; accent?: string }) {
  const def = PICTOGRAMS[pictogramKey];
  if (!def) return null;
  const startJoints = resolvePose(def.start);
  const endJoints = resolvePose(def.end);

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] text-tertiary tracking-widest">{def.label.toUpperCase()} — UTFØRELSE</span>
      <svg viewBox="0 0 220 100" className="w-full text-hair" style={{ maxHeight: 130 }}>
        <line x1={110} y1={2} x2={110} y2={98} stroke="currentColor" strokeWidth={1} opacity={0.3} strokeDasharray="2,3" />
        <g>
          <Figure joints={startJoints} accent={accent} bar={def.bar} bench={def.bench} floor={def.floor} />
        </g>
        <g transform="translate(110,0)">
          <Figure joints={endJoints} accent={accent} bar={def.bar} bench={def.bench} floor={def.floor} />
        </g>
        <text x={55} y={98} textAnchor="middle" fontSize={7} fill={accent} fontFamily="'JetBrains Mono', monospace" opacity={0.8}>
          START
        </text>
        <text x={165} y={98} textAnchor="middle" fontSize={7} fill={accent} fontFamily="'JetBrains Mono', monospace" opacity={0.8}>
          SLUTT
        </text>
      </svg>
    </div>
  );
}
