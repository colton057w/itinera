/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo1234!";

/** Slugs we own — re-seed deletes these so you can run `prisma db seed` again cleanly. */
const SAMPLE_SLUGS = [
  "sample-amalfi-destination-wedding",
  "sample-iceland-ring-road",
  "sample-napa-wine-weekend",
];

function hotScore(voteScore, createdAt) {
  const s = voteScore;
  const order = Math.log10(Math.max(Math.abs(s), 1));
  const sign = s > 0 ? 1 : s < 0 ? -1 : 0;
  const seconds = createdAt.getTime() / 1000;
  return order + (sign * seconds) / 45000;
}

async function ensureTag(name) {
  return prisma.tag.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const demo = await prisma.user.upsert({
    where: { email: "demo@itinera.local" },
    create: {
      email: "demo@itinera.local",
      name: "Alex Chen",
      passwordHash,
    },
    update: {
      passwordHash,
      name: "Alex Chen",
    },
  });

  const sarah = await prisma.user.upsert({
    where: { email: "sarah@itinera.local" },
    create: {
      email: "sarah@itinera.local",
      name: "Sarah Morales",
      passwordHash,
    },
    update: {
      passwordHash,
      name: "Sarah Morales",
    },
  });

  await prisma.itinerary.deleteMany({
    where: { slug: { in: SAMPLE_SLUGS } },
  });

  const createdAt1 = new Date("2026-03-15T10:00:00Z");
  const createdAt2 = new Date("2026-03-20T14:30:00Z");
  const createdAt3 = new Date("2026-04-01T09:00:00Z");

  const tagSets = [
    ["italy", "destination-wedding", "luxury", "summer"],
    ["iceland", "road-trip", "backpacking", "photography"],
    ["napa", "wine-country", "weekend", "romantic"],
  ];

  for (const names of tagSets) {
    for (const n of names) {
      await ensureTag(n);
    }
  }

  await prisma.itinerary.create({
    data: {
      ownerId: sarah.id,
      title: "Amalfi Coast destination wedding",
      slug: SAMPLE_SLUGS[0],
      summary:
        "A long weekend in Ravello: rehearsal dinner with a view, villa ceremony, and a send-off brunch your guests can clone for their own dates.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
      visibility: "PUBLIC",
      voteScore: 22,
      hotScore: hotScore(22, createdAt1),
      createdAt: createdAt1,
      tags: {
        create: [
          { tag: { connect: { name: "italy" } } },
          { tag: { connect: { name: "destination-wedding" } } },
          { tag: { connect: { name: "luxury" } } },
          { tag: { connect: { name: "summer" } } },
        ],
      },
      days: {
        create: [
          {
            dayIndex: 0,
            label: "Thursday — Welcome & rehearsal",
            date: new Date("2026-06-11"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "FLIGHT",
                  title: "NAP → shuttle to Ravello",
                  description:
                    "Group block on a mid-morning arrival. Private shuttle picks up at arrivals and winds up the coast.",
                  location: "Naples Airport (NAP)",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
                  media: {
                    create: [
                      {
                        url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
                        sortOrder: 0,
                      },
                    ],
                  },
                },
                {
                  eventIndex: 1,
                  type: "HOTEL",
                  title: "Check-in — Hotel Caruso",
                  description: "Sea-view rooms under the wedding block. Welcome prosecco at the terrace bar.",
                  location: "Ravello, Italy",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
                },
                {
                  eventIndex: 2,
                  type: "MEAL",
                  title: "Rehearsal dinner — Villa Maria",
                  description:
                    "Family-style lemon pasta, local wine, short speeches. Dress: relaxed coastal chic.",
                  location: "Villa Maria, Ravello",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
                },
              ],
            },
          },
          {
            dayIndex: 1,
            label: "Friday — The big day",
            date: new Date("2026-06-12"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "Hair & makeup — bridal suite",
                  description: "7:30 call; light breakfast delivered to the suite.",
                  location: "Hotel Caruso",
                },
                {
                  eventIndex: 1,
                  type: "ACTIVITY",
                  title: "Ceremony — Belvedere garden",
                  description: "5pm ceremony, string trio, seated on the garden terrace.",
                  location: "Belvedere di Villa Rufolo",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
                  media: {
                    create: [
                      {
                        url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
                        sortOrder: 0,
                      },
                      {
                        url: "https://images.unsplash.com/photo-1460978815777-49852efd15cd?w=800&q=80",
                        sortOrder: 1,
                      },
                    ],
                  },
                },
                {
                  eventIndex: 2,
                  type: "MEAL",
                  title: "Reception & dancing",
                  description: "Aperitivo on the terrace, four-course dinner, DJ until midnight.",
                  location: "Hotel Caruso terrace",
                },
              ],
            },
          },
          {
            dayIndex: 2,
            label: "Saturday — Farewell brunch",
            date: new Date("2026-06-13"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "MEAL",
                  title: "Poolside brunch",
                  description: "Bloody Marys optional. Group transfers to NAP leave at 1pm & 4pm.",
                  location: "Hotel Caruso pool",
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.itinerary.create({
    data: {
      ownerId: demo.id,
      title: "Iceland ring road — 6 days",
      slug: SAMPLE_SLUGS[1],
      summary:
        "Summer daylight, waterfalls, and hot pots. Built for two drivers and a small SUV; easy to shift dates once you clone it.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
      visibility: "PUBLIC",
      voteScore: 14,
      hotScore: hotScore(14, createdAt2),
      createdAt: createdAt2,
      tags: {
        create: [
          { tag: { connect: { name: "iceland" } } },
          { tag: { connect: { name: "road-trip" } } },
          { tag: { connect: { name: "backpacking" } } },
          { tag: { connect: { name: "photography" } } },
        ],
      },
      days: {
        create: [
          {
            dayIndex: 0,
            label: "Day 1 — Reykjavík",
            date: new Date("2026-07-08"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "FLIGHT",
                  title: "Land KEF, pick up SUV",
                  location: "Keflavík Airport",
                },
                {
                  eventIndex: 1,
                  type: "HOTEL",
                  title: "Stay — Reykjavík center",
                  description: "Walkable to fish & chips and a late sunset stroll.",
                  location: "Reykjavík",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80",
                },
              ],
            },
          },
          {
            dayIndex: 1,
            label: "Day 2 — Golden Circle",
            date: new Date("2026-07-09"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "Þingvellir & Geysir",
                  description: "Early start to beat buses; picnic lunch in the car.",
                  location: "Golden Circle",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1520769945061-0a448c463741?w=800&q=80",
                },
                {
                  eventIndex: 1,
                  type: "ACTIVITY",
                  title: "Gullfoss",
                  location: "Gullfoss waterfall",
                },
              ],
            },
          },
          {
            dayIndex: 2,
            label: "Day 3 — South coast highlight",
            date: new Date("2026-07-10"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "Skógafoss & black sand beach",
                  location: "Vík area",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80",
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.itinerary.create({
    data: {
      ownerId: demo.id,
      title: "Napa long weekend",
      slug: SAMPLE_SLUGS[2],
      summary: "Two days of tastings, one big dinner, zero stress — fork this for bachelorettes or couples.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80",
      visibility: "PUBLIC",
      voteScore: 9,
      hotScore: hotScore(9, createdAt3),
      createdAt: createdAt3,
      tags: {
        create: [
          { tag: { connect: { name: "napa" } } },
          { tag: { connect: { name: "wine-country" } } },
          { tag: { connect: { name: "weekend" } } },
          { tag: { connect: { name: "romantic" } } },
        ],
      },
      days: {
        create: [
          {
            dayIndex: 0,
            label: "Friday",
            date: new Date("2026-05-15"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "HOTEL",
                  title: "Check-in — downtown Napa",
                  location: "Napa, CA",
                },
                {
                  eventIndex: 1,
                  type: "ACTIVITY",
                  title: "Afternoon tasting — small producer",
                  description: "Reservation 2pm; share a cheese board.",
                  location: "St. Helena",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80",
                },
                {
                  eventIndex: 2,
                  type: "MEAL",
                  title: "Dinner — courtyard patio",
                  location: "Yountville",
                },
              ],
            },
          },
          {
            dayIndex: 1,
            label: "Saturday",
            date: new Date("2026-05-16"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "MEAL",
                  title: "Brunch in town",
                  location: "Napa",
                },
                {
                  eventIndex: 1,
                  type: "ACTIVITY",
                  title: "Cycle path or spa block",
                  description: "Pick one — nap before dinner.",
                  location: "Napa Valley",
                },
                {
                  eventIndex: 2,
                  type: "MEAL",
                  title: "Winemaker dinner",
                  location: "Oakville",
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("\n  Demo logins (local dev — same password):");
  console.log(`    ${demo.email}  /  ${DEMO_PASSWORD}  (Alex — two sample trips)`);
  console.log(`    ${sarah.email}  /  ${DEMO_PASSWORD}  (Sarah — Amalfi wedding)`);
  console.log("\n  Seeded 3 public itineraries:");
  for (const slug of SAMPLE_SLUGS) {
    console.log(`    http://localhost:3000/itineraries/${slug}`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
