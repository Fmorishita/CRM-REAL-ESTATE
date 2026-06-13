import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  alta: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  media: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  baja: "bg-muted text-muted-foreground ring-border",
};

export function MatchScore({ score, tier }: { score: number; tier: "alta" | "media" | "baja" }) {
  return (
    <div
      className={cn(
        "flex size-12 shrink-0 flex-col items-center justify-center rounded-full ring-1",
        TONES[tier],
      )}
    >
      <span className="text-sm font-semibold tabular-nums leading-none">{score}%</span>
      <span className="text-[9px] uppercase tracking-wide">match</span>
    </div>
  );
}
