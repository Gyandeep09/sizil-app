export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "unknown";

  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown";

  const diffMs = Date.now() - then;
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 60) return "just now";

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;

  const diffMonth = Math.round(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;

  const diffYear = Math.round(diffMonth / 12);
  return `${diffYear}y ago`;
}

export function formatDateGroupLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffDays = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
    month: "short",
    day: "numeric",
  });
}

export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string
): Array<{ label: string; items: T[] }> {
  const buckets = new Map<string, { label: string; sortKey: number; items: T[] }>();

  for (const item of items) {
    const iso = getDate(item);
    const date = new Date(iso);
    const key = Number.isNaN(date.getTime())
      ? "unknown"
      : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (!buckets.has(key)) {
      buckets.set(key, {
        label: formatDateGroupLabel(iso),
        sortKey: Number.isNaN(date.getTime()) ? -Infinity : date.getTime(),
        items: [],
      });
    }
    buckets.get(key)!.items.push(item);
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ label, items }) => ({ label, items }));
}

export const STALE_THRESHOLD_DAYS = 30;

export function isStale(lastModified: string | null): boolean {
  if (!lastModified) return false;
  const then = new Date(lastModified).getTime();
  if (Number.isNaN(then)) return false;
  const diffDays = (Date.now() - then) / (1000 * 60 * 60 * 24);
  return diffDays >= STALE_THRESHOLD_DAYS;
}
