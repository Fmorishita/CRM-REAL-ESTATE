import { cn } from "@/lib/utils";
import type { NamedValue } from "@/modules/analytics/types";

export function BarList({ items, accent = "bg-primary/80" }: { items: NamedValue[]; accent?: string }) {
  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Sin datos.</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2.5">
      {items.map((item, idx) => (
        <li key={idx} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums text-foreground">{item.valueLabel ?? item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", accent)} style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DONUT_COLORS = ["#2563eb", "#7c3aed", "#0d9488", "#d97706", "#db2777", "#64748b"];

export function Donut({ items }: { items: NamedValue[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Sin datos.</p>;
  }
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  // Precompute each segment's dash length and offset (no mutation during render).
  const segments = items.reduce<{ dash: number; offset: number; color: string }[]>((acc, item, idx) => {
    const dash = (item.value / total) * circumference;
    const offset = idx === 0 ? 0 : acc[idx - 1]!.offset + acc[idx - 1]!.dash;
    acc.push({ dash, offset, color: DONUT_COLORS[idx % DONUT_COLORS.length]! });
    return acc;
  }, []);

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="size-28 -rotate-90">
        {segments.map((seg, idx) => (
          <circle
            key={idx}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={-seg.offset}
          />
        ))}
      </svg>
      <ul className="flex-1 space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
              {item.label}
            </span>
            <span className="font-medium tabular-nums text-foreground">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Funnel({ items }: { items: NamedValue[] }) {
  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Sin oportunidades.</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-xs text-muted-foreground">{item.label}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
            <div
              className="flex h-full items-center justify-end rounded-md bg-primary/80 px-2 text-[11px] font-medium text-primary-foreground"
              style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
            >
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
