export function slugFromTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const safe = base.length > 0 ? base : "itinerary";
  return `${safe}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
