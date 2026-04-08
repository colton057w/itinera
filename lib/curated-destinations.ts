/**
 * Curated destinations for marketing / explore.
 * Primary source: Postgres (seed via `prisma/seed-curated.ts`). Fallback: `lib/curated-fallback.ts`.
 */
export type { CuratedAttraction, CuratedCity, CuratedExperience } from "@/lib/curated-types";
export {
  getCuratedCities,
  getCuratedCityBySlug,
  getCuratedCitySlugs,
  getTopAttractions,
} from "@/lib/curated-db";
