import type { Itinerary } from "@prisma/client";

/** Reddit-style “hot” ordering: score magnitude + sign × age factor */
export function computeHotScore(voteScore: number, createdAt: Date): number {
  const s = voteScore;
  const order = Math.log10(Math.max(Math.abs(s), 1));
  const sign = s > 0 ? 1 : s < 0 ? -1 : 0;
  const seconds = createdAt.getTime() / 1000;
  return order + (sign * seconds) / 45_000;
}

export function hotScoreFromItinerary(it: Pick<Itinerary, "voteScore" | "createdAt">): number {
  return computeHotScore(it.voteScore, it.createdAt);
}
