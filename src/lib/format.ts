/** Locale-aware formatters. Currency and locale always come from tenant config, never hardcoded. */

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

const RELATIVE_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

/** Locale-aware relative time, e.g. "hace 2 horas" / "en 3 días". */
export function formatRelativeTime(date: Date, locale: string): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  let duration = (date.getTime() - Date.now()) / 1000;
  for (const division of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return formatter.format(Math.round(duration), "years");
}

/** Short time of day, e.g. "5:00 p.m." in the org timezone. */
export function formatTime(date: Date, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }).format(date);
}

/** Day + month, e.g. "13 jun". */
export function formatDayMonth(date: Date, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone }).format(date);
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
