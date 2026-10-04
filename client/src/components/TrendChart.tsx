interface Point {
  date: Date;
  value: number;
}

export function TrendChart({ data, color, unit }: { data: Point[]; color: string; unit?: string }) {
  if (data.length < 2) {
    return <div className="font-mono text-xs text-tertiary py-8 text-center">Ikke nok data ennå — logg noen flere ganger.</div>;
  }

  const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  const values = sorted.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const pad = (maxVal - minVal) * 0.15 || 1;
  const yMin = minVal - pad;
  const yMax = maxVal + pad;

  const minTime = sorted[0].date.getTime();
  const maxTime = sorted[sorted.length - 1].date.getTime();
  const timeSpan = maxTime - minTime || 1;

  const W = 400;
  const H = 160;
  const PAD_L = 36;
  const PAD_R = 10;
  const PAD_T = 12;
  const PAD_B = 22;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const toXY = (p: Point) => {
    const x = PAD_L + ((p.date.getTime() - minTime) / timeSpan) * plotW;
    const y = PAD_T + (1 - (p.value - yMin) / (yMax - yMin)) * plotH;
    return [x, y];
  };

  const pathD = sorted
    .map(toXY)
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const gridLines = [0, 0.5, 1];

  const fmtDate = (d: Date) => d.toLocaleDateString("no-NO", { day: "2-digit", month: "2-digit" });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 180 }}>
      {gridLines.map((f) => {
        const y = PAD_T + f * plotH;
        const val = yMax - f * (yMax - yMin);
        return (
          <g key={f}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="currentColor" className="text-hair" strokeWidth={1} />
            <text x={PAD_L - 6} y={y + 3} textAnchor="end" fontSize={8} fill="currentColor" className="text-tertiary" fontFamily="'JetBrains Mono', monospace">
              {val.toFixed(1)}
            </text>
          </g>
        );
      })}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {sorted.map((p, i) => {
        const [x, y] = toXY(p);
        return <circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
      })}
      <text x={PAD_L} y={H - 4} fontSize={8} fill="currentColor" className="text-tertiary" fontFamily="'JetBrains Mono', monospace">
        {fmtDate(sorted[0].date)}
      </text>
      <text x={W - PAD_R} y={H - 4} textAnchor="end" fontSize={8} fill="currentColor" className="text-tertiary" fontFamily="'JetBrains Mono', monospace">
        {fmtDate(sorted[sorted.length - 1].date)}
      </text>
      {unit && (
        <text x={W - PAD_R} y={PAD_T - 2} textAnchor="end" fontSize={8} fill={color} fontFamily="'JetBrains Mono', monospace">
          {unit}
        </text>
      )}
    </svg>
  );
}

export const INTERVALS: { key: string; label: string; days: number | null }[] = [
  { key: "4w", label: "4U", days: 28 },
  { key: "3m", label: "3M", days: 90 },
  { key: "6m", label: "6M", days: 180 },
  { key: "1y", label: "1Å", days: 365 },
  { key: "all", label: "ALT", days: null },
];

export function IntervalTabs({ value, onChange, accent }: { value: string; onChange: (key: string) => void; accent: string }) {
  return (
    <div className="flex gap-1">
      {INTERVALS.map((i) => (
        <button
          key={i.key}
          onClick={() => onChange(i.key)}
          className={`font-mono text-[10px] px-2 py-1 border ${value === i.key ? "" : "text-secondary border-hair-bright"}`}
          style={value === i.key ? { backgroundColor: accent, color: "#0A0D10", borderColor: accent } : undefined}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function cutoffDateForInterval(key: string): Date | null {
  const interval = INTERVALS.find((i) => i.key === key);
  if (!interval || interval.days == null) return null;
  return new Date(Date.now() - interval.days * 24 * 60 * 60 * 1000);
}
