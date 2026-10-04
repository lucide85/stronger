export function SetTicks({ total, completed, current }: { total: number; completed: number; current?: number }) {
  return (
    <div className="flex gap-1.5 w-full">
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < completed;
        const isCurrent = i === current;
        return (
          <div
            key={i}
            className="flex-1 h-2 rounded-sm bg-hair"
            style={
              isDone
                ? { backgroundColor: "var(--accent, #FF8C42)" }
                : isCurrent
                  ? { backgroundColor: "transparent", border: "1px solid var(--accent, #FF8C42)" }
                  : undefined
            }
          />
        );
      })}
    </div>
  );
}
