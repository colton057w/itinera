import type { EventType } from "@prisma/client";

const MUSEUM_LIKE = /\b(museum|gallery|uffizi|louvre|prado|rijks|borghese|vatican)\b/i;
const RESTAURANT_LIKE = /\b(restaurant|bistro|trattoria|café|cafe|dinner|brunch|omakase|tavern)\b/i;

/** 0 = Sunday … 6 = Saturday (UTC — align with stored event times) */
function utcWeekday(d: Date): number {
  return d.getUTCDay();
}

/**
 * Heuristic “heads up” when a timed stop may land on a day venues often close.
 * Not a live Places lookup — avoids API cost; good for post–smart-clone review.
 */
export function venueClosureHint(input: {
  type: EventType;
  title: string;
  at: Date | null;
}): string | null {
  if (!input.at || Number.isNaN(input.at.getTime())) return null;
  const w = utcWeekday(input.at);
  const title = input.title;
  const t = input.type;

  if (t === "ACTIVITY" && MUSEUM_LIKE.test(title)) {
    if (w === 1) {
      return "Many museums are closed on Mondays — double-check hours.";
    }
    if (w === 0) {
      return "Some museums have reduced Sunday hours — verify before you go.";
    }
  }

  if ((t === "MEAL" || t === "CUSTOM") && RESTAURANT_LIKE.test(title)) {
    if (w === 1) {
      return "Some restaurants close Mondays — worth confirming.";
    }
  }

  if (t === "HOTEL" && w === 0) {
    return "Sunday check-ins can have different desk hours — message the property if arriving late.";
  }

  return null;
}
