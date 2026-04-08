import type { CuratedExperienceKind } from "@prisma/client";
import type { StoryKind } from "@/components/itinerary/storybook/types";
import { FALLBACK_CITIES, FALLBACK_TOP_ATTRACTIONS } from "@/lib/curated-fallback";
import type { CuratedAttraction, CuratedCity, CuratedExperience } from "@/lib/curated-types";
import { prisma } from "@/lib/prisma";

function isDbConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; name?: string; message?: string };
  if (e.code === "P1001") return true;
  if (e.code === "P2021") return true;
  if (e.name === "PrismaClientInitializationError") return true;
  if (typeof e.message === "string" && e.message.includes("Can't reach database")) {
    return true;
  }
  return false;
}

function kindToStory(k: CuratedExperienceKind): StoryKind {
  const m: Record<CuratedExperienceKind, StoryKind> = {
    ACTIVITY: "activity",
    MEAL: "meal",
    STAY: "stay",
    TRANSIT: "transit",
  };
  return m[k];
}

function mapDbExperience(row: {
  id: string;
  experienceKey: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  locationLabel: string;
  storyKind: CuratedExperienceKind;
}): CuratedExperience {
  return {
    id: row.id,
    experienceKey: row.experienceKey,
    title: row.title,
    subtitle: row.subtitle,
    image: row.imageUrl,
    locationLabel: row.locationLabel,
    storyKind: kindToStory(row.storyKind),
  };
}

function mapDbCity(row: {
  slug: string;
  name: string;
  country: string;
  tagline: string;
  heroImageUrl: string;
  experiences: Array<{
    id: string;
    experienceKey: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    locationLabel: string;
    storyKind: CuratedExperienceKind;
  }>;
}): CuratedCity {
  return {
    slug: row.slug,
    name: row.name,
    country: row.country,
    tagline: row.tagline,
    heroImage: row.heroImageUrl,
    experiences: row.experiences.map(mapDbExperience),
  };
}

export async function getCuratedCities(): Promise<CuratedCity[]> {
  try {
    const rows = await prisma.curatedCity.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        experiences: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (rows.length === 0) return FALLBACK_CITIES;
    return rows.map((r) =>
      mapDbCity({
        slug: r.slug,
        name: r.name,
        country: r.country,
        tagline: r.tagline,
        heroImageUrl: r.heroImageUrl,
        experiences: r.experiences,
      }),
    );
  } catch (e) {
    if (isDbConnectionError(e)) return FALLBACK_CITIES;
    throw e;
  }
}

export async function getCuratedCityBySlug(slug: string): Promise<CuratedCity | undefined> {
  try {
    const row = await prisma.curatedCity.findUnique({
      where: { slug },
      include: { experiences: { orderBy: { sortOrder: "asc" } } },
    });
    if (!row) {
      return FALLBACK_CITIES.find((c) => c.slug === slug);
    }
    return mapDbCity({
      slug: row.slug,
      name: row.name,
      country: row.country,
      tagline: row.tagline,
      heroImageUrl: row.heroImageUrl,
      experiences: row.experiences,
    });
  } catch (e) {
    if (isDbConnectionError(e)) return FALLBACK_CITIES.find((c) => c.slug === slug);
    throw e;
  }
}

export async function getTopAttractions(limit = 12): Promise<CuratedAttraction[]> {
  try {
    const rows = await prisma.curatedAttraction.findMany({
      take: limit,
      orderBy: { sortOrder: "asc" },
      include: { city: { select: { slug: true, name: true } } },
    });
    if (rows.length === 0) return FALLBACK_TOP_ATTRACTIONS.slice(0, limit);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      city: r.city.name,
      citySlug: r.city.slug,
      image: r.imageUrl,
    }));
  } catch (e) {
    if (isDbConnectionError(e)) return FALLBACK_TOP_ATTRACTIONS.slice(0, limit);
    throw e;
  }
}

export async function getCuratedCitySlugs(): Promise<string[]> {
  try {
    const rows = await prisma.curatedCity.findMany({
      select: { slug: true },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length === 0) return FALLBACK_CITIES.map((c) => c.slug);
    return rows.map((r) => r.slug);
  } catch (e) {
    if (isDbConnectionError(e)) return FALLBACK_CITIES.map((c) => c.slug);
    throw e;
  }
}
