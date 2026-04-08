import { PrismaClient, type CuratedExperienceKind } from "@prisma/client";
import { FALLBACK_CITIES, FALLBACK_TOP_ATTRACTIONS } from "../lib/curated-fallback";

const prisma = new PrismaClient();

function storyKindToEnum(sk: string): CuratedExperienceKind {
  const m: Record<string, CuratedExperienceKind> = {
    activity: "ACTIVITY",
    meal: "MEAL",
    stay: "STAY",
    transit: "TRANSIT",
  };
  return m[sk] ?? "ACTIVITY";
}

async function main() {
  let order = 0;
  for (const city of FALLBACK_CITIES) {
    const c = await prisma.curatedCity.upsert({
      where: { slug: city.slug },
      create: {
        slug: city.slug,
        name: city.name,
        country: city.country,
        tagline: city.tagline,
        heroImageUrl: city.heroImage,
        sortOrder: order,
      },
      update: {
        name: city.name,
        country: city.country,
        tagline: city.tagline,
        heroImageUrl: city.heroImage,
        sortOrder: order,
      },
    });
    order += 1;

    await prisma.curatedExperience.deleteMany({ where: { cityId: c.id } });
    let ei = 0;
    for (const ex of city.experiences) {
      await prisma.curatedExperience.create({
        data: {
          cityId: c.id,
          experienceKey: ex.experienceKey,
          title: ex.title,
          subtitle: ex.subtitle,
          imageUrl: ex.image,
          locationLabel: ex.locationLabel,
          storyKind: storyKindToEnum(ex.storyKind),
          sortOrder: ei,
        },
      });
      ei += 1;
    }
  }

  await prisma.curatedAttraction.deleteMany({});

  let ai = 0;
  for (const a of FALLBACK_TOP_ATTRACTIONS) {
    const city = await prisma.curatedCity.findUnique({ where: { slug: a.citySlug } });
    if (!city) continue;
    await prisma.curatedAttraction.create({
      data: {
        cityId: city.id,
        title: a.title,
        imageUrl: a.image,
        sortOrder: ai,
      },
    });
    ai += 1;
  }

  await prisma.marketFlightDeal.deleteMany({ where: { source: "seed" } });
  const seeds = [
    {
      headline: "New York ↔ Lisbon",
      subline: "Weekly sample fare watch",
      originCode: "NYC",
      destCode: "LIS",
      priceHint: "Typical RT ~$380–520",
      tag: "Trending",
      sortOrder: 0,
    },
    {
      headline: "San Francisco ↔ Tokyo",
      subline: "Nonstop alerts",
      originCode: "SFO",
      destCode: "NRT",
      priceHint: "Watch summer peaks",
      tag: "Pacific",
      sortOrder: 1,
    },
    {
      headline: "Chicago ↔ Barcelona",
      subline: "Shoulder season",
      originCode: "CHI",
      destCode: "BCN",
      priceHint: "Great Mar–May window",
      tag: "Europe",
      sortOrder: 2,
    },
    {
      headline: "Denver ↔ Paris",
      subline: "Premium cabin dips",
      originCode: "DEN",
      destCode: "PAR",
      priceHint: "Business alerts",
      tag: "Upgrade",
      sortOrder: 3,
    },
  ];
  for (const d of seeds) {
    await prisma.marketFlightDeal.create({
      data: { ...d, source: "seed" },
    });
  }

  console.log("Curated cities, experiences, attractions, and flight deal rows are ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
