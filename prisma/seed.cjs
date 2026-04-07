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
  "sample-aspen-ski-week-2026",
  "sample-tokyo-spring-2026",
  "sample-tulum-beach-week-2026",
  "sample-charleston-autumn-2026",
  "sample-london-winter-lights-2026",
  "sample-new-orleans-jazz-fest-2026",
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
    ["aspen", "ski", "winter", "colorado"],
    ["tokyo", "japan", "spring", "food"],
    ["tulum", "mexico", "beach", "summer"],
    ["charleston", "south-carolina", "fall", "historic"],
    ["london", "uk", "holiday", "city-break"],
    ["new-orleans", "louisiana", "music", "festival"],
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
      tripKind: "WEDDING_EVENT",
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
          {
            dayIndex: 3,
            label: "Day 4 — East toward Egilsstaðir",
            date: new Date("2026-07-11"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "Jökulsárlón glacier lagoon",
                  location: "Höfn area",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1539066115640-2a164f6a3d34?w=800&q=80",
                },
              ],
            },
          },
          {
            dayIndex: 4,
            label: "Day 5 — Mývatn & hot springs",
            date: new Date("2026-07-12"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "HOTEL",
                  title: "Stay near Lake Mývatn",
                  location: "Mývatn",
                },
                {
                  eventIndex: 1,
                  type: "ACTIVITY",
                  title: "Mývatn Nature Baths",
                  description: "Soak at sunset — book ahead.",
                  location: "Mývatn",
                },
              ],
            },
          },
          {
            dayIndex: 5,
            label: "Day 6 — Return to Reykjavík",
            date: new Date("2026-07-13"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "Drive back + blue lagoon slot (optional)",
                  location: "Reykjanes",
                },
                {
                  eventIndex: 1,
                  type: "FLIGHT",
                  title: "Evening flight home",
                  location: "KEF",
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

  const createdAt4 = new Date("2026-01-08T12:00:00Z");
  const createdAt5 = new Date("2026-02-14T11:00:00Z");
  const createdAt6 = new Date("2026-04-22T16:00:00Z");
  const createdAt7 = new Date("2026-08-05T10:00:00Z");
  const createdAt8 = new Date("2026-09-30T09:00:00Z");
  const createdAt9 = new Date("2026-11-18T14:00:00Z");

  await prisma.itinerary.create({
    data: {
      ownerId: demo.id,
      title: "Aspen ski week",
      slug: SAMPLE_SLUGS[3],
      summary:
        "Bluebird days, après at the base, and one fancy dinner in town — clone and shift for your crew’s dates.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=80",
      visibility: "PUBLIC",
      tripKind: "VACATION",
      voteScore: 11,
      hotScore: hotScore(11, createdAt4),
      createdAt: createdAt4,
      tags: {
        create: [
          { tag: { connect: { name: "aspen" } } },
          { tag: { connect: { name: "ski" } } },
          { tag: { connect: { name: "winter" } } },
          { tag: { connect: { name: "colorado" } } },
        ],
      },
      days: {
        create: [
          {
            dayIndex: 0,
            label: "Saturday — Arrivals",
            date: new Date("2026-01-17"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "HOTEL",
                  title: "Check-in — slope-side condo",
                  location: "Aspen, CO",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
                },
                {
                  eventIndex: 1,
                  type: "MEAL",
                  title: "Welcome dinner — steakhouse",
                  location: "Downtown Aspen",
                },
              ],
            },
          },
          {
            dayIndex: 1,
            label: "Sunday — On snow",
            date: new Date("2026-01-18"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "Full day Aspen Mountain",
                  description: "Meet 9am gondola; lunch on-mountain.",
                  location: "Aspen Mountain",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
                },
              ],
            },
          },
          {
            dayIndex: 2,
            label: "Monday — Departure",
            date: new Date("2026-01-19"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "MEAL",
                  title: "Brunch before airport",
                  location: "Aspen",
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
      ownerId: sarah.id,
      title: "Tokyo spring food crawl",
      slug: SAMPLE_SLUGS[4],
      summary:
        "Cherry-blossom season: izakayas, Tsukiji outer market, and one fancy omakase — dates are easy to remap after you clone.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80",
      visibility: "PUBLIC",
      tripKind: "VACATION",
      voteScore: 18,
      hotScore: hotScore(18, createdAt5),
      createdAt: createdAt5,
      tags: {
        create: [
          { tag: { connect: { name: "tokyo" } } },
          { tag: { connect: { name: "japan" } } },
          { tag: { connect: { name: "spring" } } },
          { tag: { connect: { name: "food" } } },
        ],
      },
      days: {
        create: [
          {
            dayIndex: 0,
            label: "Day 1 — Shibuya & dinner",
            date: new Date("2026-03-20"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "HOTEL",
                  title: "Check-in — Shibuya",
                  location: "Tokyo",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
                },
                {
                  eventIndex: 1,
                  type: "MEAL",
                  title: "Late ramen — neighborhood shop",
                  location: "Shibuya",
                },
              ],
            },
          },
          {
            dayIndex: 1,
            label: "Day 2 — Markets & gardens",
            date: new Date("2026-03-21"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "Tsukiji outer market walk",
                  location: "Tsukiji",
                },
                {
                  eventIndex: 1,
                  type: "ACTIVITY",
                  title: "Ueno Park stroll",
                  location: "Ueno",
                },
              ],
            },
          },
          {
            dayIndex: 2,
            label: "Day 3 — Omakase night",
            date: new Date("2026-03-22"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "MEAL",
                  title: "Omakase reservation",
                  description: "7pm — reconfirm 24h ahead.",
                  location: "Ginza",
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
      title: "Tulum beach week",
      slug: SAMPLE_SLUGS[5],
      summary: "Jungle-meets-sea: cenote morning, beach club afternoon, tacos forever.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
      visibility: "PUBLIC",
      tripKind: "VACATION",
      voteScore: 16,
      hotScore: hotScore(16, createdAt6),
      createdAt: createdAt6,
      tags: {
        create: [
          { tag: { connect: { name: "tulum" } } },
          { tag: { connect: { name: "mexico" } } },
          { tag: { connect: { name: "beach" } } },
          { tag: { connect: { name: "summer" } } },
        ],
      },
      days: {
        create: [
          {
            dayIndex: 0,
            label: "Saturday",
            date: new Date("2026-08-08"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "HOTEL",
                  title: "Boutique hotel — beach road",
                  location: "Tulum, Mexico",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
                },
                {
                  eventIndex: 1,
                  type: "MEAL",
                  title: "Ceviche & mezcal",
                  location: "Tulum town",
                },
              ],
            },
          },
          {
            dayIndex: 1,
            label: "Sunday",
            date: new Date("2026-08-09"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "Cenote swim (early)",
                  location: "Gran Cenote area",
                },
                {
                  eventIndex: 1,
                  type: "ACTIVITY",
                  title: "Beach club afternoon",
                  location: "Tulum beach",
                },
              ],
            },
          },
          {
            dayIndex: 2,
            label: "Monday",
            date: new Date("2026-08-10"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "MEAL",
                  title: "Long brunch before flight",
                  location: "Tulum",
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
      ownerId: sarah.id,
      title: "Charleston long weekend",
      slug: SAMPLE_SLUGS[6],
      summary: "Low-country food, pastel streets, and one harbor sunset sail.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
      visibility: "PUBLIC",
      tripKind: "VACATION",
      voteScore: 13,
      hotScore: hotScore(13, createdAt7),
      createdAt: createdAt7,
      tags: {
        create: [
          { tag: { connect: { name: "charleston" } } },
          { tag: { connect: { name: "south-carolina" } } },
          { tag: { connect: { name: "fall" } } },
          { tag: { connect: { name: "historic" } } },
        ],
      },
      days: {
        create: [
          {
            dayIndex: 0,
            label: "Friday",
            date: new Date("2026-10-16"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "HOTEL",
                  title: "Inn — French Quarter",
                  location: "Charleston, SC",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
                },
                {
                  eventIndex: 1,
                  type: "MEAL",
                  title: "Shrimp & grits dinner",
                  location: "King Street",
                },
              ],
            },
          },
          {
            dayIndex: 1,
            label: "Saturday",
            date: new Date("2026-10-17"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "Walking tour + market",
                  location: "Historic district",
                },
                {
                  eventIndex: 1,
                  type: "ACTIVITY",
                  title: "Sunset sail",
                  location: "Charleston Harbor",
                },
              ],
            },
          },
          {
            dayIndex: 2,
            label: "Sunday",
            date: new Date("2026-10-18"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "MEAL",
                  title: "Brunch then depart",
                  location: "Charleston",
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
      title: "London winter lights",
      slug: SAMPLE_SLUGS[7],
      summary: "Covent Garden, South Bank strolls, and a West End show — perfect for a December city break.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1513635269976-596ae1088a88?w=1200&q=80",
      visibility: "PUBLIC",
      tripKind: "VACATION",
      voteScore: 15,
      hotScore: hotScore(15, createdAt8),
      createdAt: createdAt8,
      tags: {
        create: [
          { tag: { connect: { name: "london" } } },
          { tag: { connect: { name: "uk" } } },
          { tag: { connect: { name: "holiday" } } },
          { tag: { connect: { name: "city-break" } } },
        ],
      },
      days: {
        create: [
          {
            dayIndex: 0,
            label: "Thursday",
            date: new Date("2026-12-10"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "HOTEL",
                  title: "Check-in — Covent Garden",
                  location: "London",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1513635269976-596ae1088a88?w=800&q=80",
                },
                {
                  eventIndex: 1,
                  type: "ACTIVITY",
                  title: "South Bank lights walk",
                  location: "South Bank",
                },
              ],
            },
          },
          {
            dayIndex: 1,
            label: "Friday",
            date: new Date("2026-12-11"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "British Museum (timed entry)",
                  location: "Bloomsbury",
                },
                {
                  eventIndex: 1,
                  type: "ACTIVITY",
                  title: "West End show",
                  location: "Theatre district",
                },
              ],
            },
          },
          {
            dayIndex: 2,
            label: "Saturday",
            date: new Date("2026-12-12"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "MEAL",
                  title: "Roast & pub afternoon",
                  location: "Marylebone",
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
      ownerId: sarah.id,
      title: "New Orleans Jazz Fest long weekend",
      slug: SAMPLE_SLUGS[8],
      summary: "Fest days, po’boys at night, and a recovery brunch on Monday.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1524522173746-f628baad3644?w=1200&q=80",
      visibility: "PUBLIC",
      tripKind: "WEDDING_EVENT",
      voteScore: 19,
      hotScore: hotScore(19, createdAt9),
      createdAt: createdAt9,
      tags: {
        create: [
          { tag: { connect: { name: "new-orleans" } } },
          { tag: { connect: { name: "louisiana" } } },
          { tag: { connect: { name: "music" } } },
          { tag: { connect: { name: "festival" } } },
        ],
      },
      days: {
        create: [
          {
            dayIndex: 0,
            label: "Friday — Arrive",
            date: new Date("2026-04-24"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "HOTEL",
                  title: "B&B — Marigny",
                  location: "New Orleans, LA",
                  coverImageUrl:
                    "https://images.unsplash.com/photo-1524522173746-f628baad3644?w=800&q=80",
                },
                {
                  eventIndex: 1,
                  type: "MEAL",
                  title: "Late po’boys",
                  location: "Frenchmen Street",
                },
              ],
            },
          },
          {
            dayIndex: 1,
            label: "Saturday — Fest",
            date: new Date("2026-04-25"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "Jazz Fest — gates open",
                  location: "Fair Grounds",
                },
                {
                  eventIndex: 1,
                  type: "MEAL",
                  title: "Crawfish with friends",
                  location: "Mid-City",
                },
              ],
            },
          },
          {
            dayIndex: 2,
            label: "Sunday — Second line energy",
            date: new Date("2026-04-26"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "ACTIVITY",
                  title: "Jazz Fest day 2",
                  location: "Fair Grounds",
                },
              ],
            },
          },
          {
            dayIndex: 3,
            label: "Monday — Easy out",
            date: new Date("2026-04-27"),
            events: {
              create: [
                {
                  eventIndex: 0,
                  type: "MEAL",
                  title: "Hangover brunch",
                  location: "Garden District",
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("\n  Demo logins (local dev — same password):");
  console.log(`    ${demo.email}  /  ${DEMO_PASSWORD}  (Alex — sample trips)`);
  console.log(`    ${sarah.email}  /  ${DEMO_PASSWORD}  (Sarah — sample trips)`);
  console.log(`\n  Seeded ${SAMPLE_SLUGS.length} public itineraries (dates across 2026):`);
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
