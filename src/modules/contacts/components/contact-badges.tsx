import { Badge } from "@/components/ui/badge";
import { stageLabel, stageTone } from "@/config/stages";
import { cn } from "@/lib/utils";

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 85
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : score >= 70
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : score >= 50
          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-9 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums",
        tone,
        className,
      )}
    >
      {score}
    </span>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", stageTone(stage))}>
      {stageLabel(stage)}
    </Badge>
  );
}

const TAG_TONES: Record<string, string> = {
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export function TagChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        TAG_TONES[color] ?? "bg-muted text-muted-foreground",
      )}
    >
      {name}
    </span>
  );
}
