import type { CSSProperties, ReactNode } from "react";

interface PanelProps {
  accent?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function Panel({ accent, className = "", style, children }: PanelProps) {
  return (
    <div
      className={`relative bg-panel border border-hair ${className}`}
      style={{ ...(accent ? ({ "--accent": accent } as CSSProperties) : {}), ...style }}
    >
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
      {children}
    </div>
  );
}
