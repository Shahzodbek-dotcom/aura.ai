import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
};

export function Progress({ value, className }: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("h-3 w-full overflow-hidden rounded-full bg-secondary/45", className)}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={safeValue}
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
