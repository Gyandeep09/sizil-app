interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  if (total === 0) return null;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="mt-2">
      <div className="h-2.5 bg-paper border-2 border-line rounded-full overflow-hidden">
        <div
          className="h-full bg-brutGreen transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="font-mono text-[10px] text-muted mt-1">
        {completed}/{total} tasks
      </p>
    </div>
  );
}
