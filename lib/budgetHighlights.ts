export type BudgetableEvent = {
  id: string;
  minor: number;
  currency: string;
};

function medianPositive(values: number[]): number | null {
  const v = values.filter((x) => x > 0).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid]! : (v[mid - 1]! + v[mid]!) / 2;
}

/** Events that look “big ticket” vs siblings in the same currency (for subtle UI emphasis). */
export function highSpendEventIds(events: BudgetableEvent[]): Set<string> {
  const priced = events.filter((e) => e.minor > 0);
  if (priced.length === 0) return new Set();

  const byCur = new Map<string, number[]>();
  for (const l of priced) {
    const c = (l.currency || "USD").toUpperCase();
    if (!byCur.has(c)) byCur.set(c, []);
    byCur.get(c)!.push(l.minor);
  }
  const med = new Map<string, number>();
  for (const [c, vals] of byCur) {
    const medv = medianPositive(vals);
    if (medv != null) med.set(c, medv);
  }
  const out = new Set<string>();
  for (const l of priced) {
    const c = (l.currency || "USD").toUpperCase();
    const m0 = med.get(c);
    if (m0 != null && l.minor >= Math.max(m0 * 1.35, m0 + 50)) {
      out.add(l.id);
    }
  }
  return out;
}
