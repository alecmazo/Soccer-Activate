import { formatClock } from "@/lib/utils";

export function TimerRing({
  remainingSec,
  totalSec,
  label,
  running,
}: {
  remainingSec: number;
  totalSec: number;
  label: string;
  running: boolean;
}) {
  const total = Math.max(1, totalSec);
  const frac = Math.max(0, Math.min(1, remainingSec / total));
  const size = 280;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * frac;
  return (
    <div className="timer-face relative mx-auto">
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-raised)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-[stroke-dasharray] duration-150 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-xs uppercase tracking-[0.22em] text-muted">
          {label}
        </p>
        <p className="font-display tabular text-6xl leading-none tracking-tight text-fg sm:text-7xl">
          {formatClock(remainingSec)}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-subtle">
          {running ? "Live" : "Paused"}
        </p>
      </div>
    </div>
  );
}
