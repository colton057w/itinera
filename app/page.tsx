import Link from "next/link";
import { FeedCard } from "@/components/feed/FeedCard";
import { TripKindFilterPills } from "@/components/feed/TripKindFilterPills";
import { FeatureShowcaseTabs } from "@/components/marketing/FeatureShowcaseTabs";
import { TopAttractionsSection } from "@/components/marketing/TopAttractionsSection";
import { TopCitiesSection } from "@/components/marketing/TopCitiesSection";
import { getCuratedCities, getTopAttractions } from "@/lib/curated-destinations";
import { queryFeed, type TripKindFilter } from "@/lib/feed";
import { loadMarketingShowcase } from "@/lib/marketing-showcase";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

type Search = {
  vibe?: string;
  location?: string;
  durationMin?: string;
  durationMax?: string;
  /** empty | vacation | wedding */
  kind?: string;
};

const featureCards = [
  {
    title: "Map-first trip planning",
    copy: "Lay out destinations, key moments, and the pace of each day without juggling separate tabs.",
  },
  {
    title: "Built for real collaboration",
    copy: "Share a polished itinerary with partners, friends, or wedding guests and keep everyone aligned.",
  },
  {
    title: "Inspiration from actual plans",
    copy: "Browse published itineraries, remix the best ideas, and turn them into your own version fast.",
  },
] as const;

const useCaseCards = [
  {
    title: "City breaks",
    copy: "Turn restaurants, museum tickets, and hotel details into a weekend that feels easy to follow.",
  },
  {
    title: "Road trips",
    copy: "Keep your route, drive days, and must-stop places in a single shareable timeline.",
  },
  {
    title: "Wedding weekends",
    copy: "Organize rehearsal dinners, welcome drinks, room blocks, and the ceremony flow in one place.",
  },
] as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const vibe = sp.vibe;
  const location = sp.location;
  const durationMin = sp.durationMin ? Number.parseInt(sp.durationMin, 10) : null;
  const durationMax = sp.durationMax ? Number.parseInt(sp.durationMax, 10) : null;

  let tripKind: TripKindFilter = "ALL";
  if (sp.kind === "vacation") tripKind = "VACATION";
  else if (sp.kind === "wedding") tripKind = "WEDDING_EVENT";

  const kindParam: "" | "vacation" | "wedding" =
    sp.kind === "vacation" || sp.kind === "wedding" ? sp.kind : "";

  const onVercel = process.env.VERCEL === "1";
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const databaseUrlLooksLocal =
    databaseUrl.length > 0 && /localhost|127\.0\.0\.1/i.test(databaseUrl);

  const session = await auth();

  const [{ items, databaseAvailable }, cities, attractions, showcaseData] = await Promise.all([
    queryFeed({
      vibe: vibe ?? null,
      location: location ?? null,
      durationMin: durationMin && !Number.isNaN(durationMin) ? durationMin : null,
      durationMax: durationMax && !Number.isNaN(durationMax) ? durationMax : null,
      tripKind,
    }),
    getCuratedCities(),
    getTopAttractions(),
    loadMarketingShowcase(session?.user?.id ?? null),
  ]);
  let voteMap = new Map<string, number>();
  let starMap = new Map<string, boolean>();
  if (databaseAvailable && session?.user?.id && items.length > 0) {
    const ids = items.map((i) => i.id);
    const [votes, stars] = await Promise.all([
      prisma.vote.findMany({
        where: { userId: session.user.id, itineraryId: { in: ids } },
      }),
      prisma.itineraryStar.findMany({
        where: { userId: session.user.id, itineraryId: { in: ids } },
        select: { itineraryId: true },
      }),
    ]);
    voteMap = new Map(votes.map((v) => [v.itineraryId, v.value]));
    starMap = new Map(stars.map((s) => [s.itineraryId, true]));
  }

  const plannerPreview =
    items.slice(0, 3).map((item, index) => ({
      day: `Day ${index + 1}`,
      title: item.title,
      note: item.summary?.trim() || `${item.dayCount} days planned`,
      tags: item.tags.slice(0, 2),
    })) || [];

  const previewStops =
    plannerPreview.length > 0
      ? plannerPreview
      : [
          {
            day: "Day 1",
            title: "Arrive and settle in",
            note: "Flights, hotel check-in, and an easy first-night dinner.",
            tags: ["arrival", "dinner"],
          },
          {
            day: "Day 2",
            title: "Anchor the best moments",
            note: "Stack the highlights in an order that makes sense on the ground.",
            tags: ["route", "highlights"],
          },
          {
            day: "Day 3",
            title: "Share the finished plan",
            note: "Send a clean timeline that everyone can follow on the trip.",
            tags: ["share", "timeline"],
          },
        ];

  const popularTags = Array.from(
    new Set(
      items.flatMap((item) =>
        item.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      )
    )
  ).slice(0, 6);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),_transparent_36%),linear-gradient(to_bottom,_rgba(255,255,255,0.98),_rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.14),_transparent_34%),linear-gradient(to_bottom,_rgba(9,9,11,1),_rgba(9,9,11,0))]" />
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-10 sm:pt-14">
        <section className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/85 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm backdrop-blur dark:border-sky-900 dark:bg-zinc-900/80 dark:text-sky-300">
              All-in-one trip planning
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-balance text-neutral-950 sm:text-6xl dark:text-white">
              Keep your map, bookings, and daily plan in one polished itinerary.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-zinc-300">
              Itinera helps you build vacations, road trips, and wedding weekends that feel easy to
              browse, easy to share, and easy to follow once the trip starts.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/itineraries/new"
                className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-neutral-950/10 transition hover:bg-neutral-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                Start planning
              </Link>
              <Link
                href="#discover"
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white/90 px-6 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-zinc-500"
              >
                Browse shared itineraries
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {featureCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/75"
                >
                  <p className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">
                    {card.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-zinc-400">
                    {card.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-10 h-36 w-36 rounded-full bg-sky-300/25 blur-3xl dark:bg-sky-500/20" />
            <div className="absolute -right-6 bottom-8 h-40 w-40 rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-500/20" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
              <div className="rounded-[1.6rem] border border-neutral-200 bg-neutral-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-zinc-800">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-400">
                      Trip workspace
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-neutral-950 dark:text-white">
                      Weekend plan at a glance
                    </h2>
                  </div>
                  <div className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    Shareable
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-3 rounded-[1.4rem] bg-white p-3 shadow-sm dark:bg-zinc-900">
                    {previewStops.map((stop) => (
                      <div
                        key={`${stop.day}-${stop.title}`}
                        className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/80"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-zinc-500">
                          {stop.day}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-zinc-100">
                          {stop.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-neutral-600 dark:text-zinc-400">
                          {stop.note}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {stop.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.4rem] border border-neutral-200 bg-[linear-gradient(145deg,#eff6ff,#ffffff_42%,#fff7ed)] p-4 dark:border-zinc-800 dark:bg-[linear-gradient(145deg,rgba(12,74,110,0.34),rgba(9,9,11,0.95)_42%,rgba(124,45,18,0.28))]">
                    <div className="grid grid-cols-[1.3fr_0.7fr] gap-3">
                      <div className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">
                            Route view
                          </p>
                          <span className="text-xs text-neutral-500 dark:text-zinc-400">Live plan</span>
                        </div>
                        <div className="mt-4 rounded-[1.4rem] bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.18),transparent_18%),radial-gradient(circle_at_78%_30%,rgba(249,115,22,0.2),transparent_20%),linear-gradient(135deg,rgba(148,163,184,0.18),rgba(255,255,255,0.84))] p-4 dark:bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.24),transparent_18%),radial-gradient(circle_at_78%_30%,rgba(251,146,60,0.18),transparent_20%),linear-gradient(135deg,rgba(39,39,42,0.95),rgba(24,24,27,0.92))]">
                          <div className="relative h-52 overflow-hidden rounded-[1.2rem] border border-white/60 bg-white/60 dark:border-white/10 dark:bg-zinc-900/40">
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,transparent_23%,rgba(148,163,184,0.25)_24%,transparent_25%,transparent_49%,rgba(148,163,184,0.25)_50%,transparent_51%,transparent_74%,rgba(148,163,184,0.25)_75%,transparent_76%),linear-gradient(transparent_0,transparent_23%,rgba(148,163,184,0.25)_24%,transparent_25%,transparent_49%,rgba(148,163,184,0.25)_50%,transparent_51%,transparent_74%,rgba(148,163,184,0.25)_75%,transparent_76%)] opacity-60" />
                            <div className="absolute left-[18%] top-[28%] h-3 w-3 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.16)]" />
                            <div className="absolute left-[56%] top-[38%] h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_0_6px_rgba(249,115,22,0.16)]" />
                            <div className="absolute left-[70%] top-[68%] h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />
                            <div className="absolute left-[21%] top-[31%] h-[2px] w-[38%] rotate-[8deg] bg-neutral-700/60 dark:bg-white/60" />
                            <div className="absolute left-[56%] top-[42%] h-[2px] w-[18%] rotate-[38deg] bg-neutral-700/60 dark:bg-white/60" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-zinc-500">
                            Stay organized
                          </p>
                          <p className="mt-2 text-sm font-semibold text-neutral-900 dark:text-zinc-100">
                            Reservations, timings, and notes stay with each day.
                          </p>
                        </div>
                        <div className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-zinc-500">
                            Publish when ready
                          </p>
                          <p className="mt-2 text-sm font-semibold text-neutral-900 dark:text-zinc-100">
                            Turn your final trip into inspiration other planners can clone.
                          </p>
                        </div>
                        <div className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-zinc-500">
                            Search-friendly
                          </p>
                          <p className="mt-2 text-sm font-semibold text-neutral-900 dark:text-zinc-100">
                            Filter by location, vibe, trip type, and trip length.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-zinc-500">
              Built for the moments that matter
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">
              Plan around the moments travelers actually remember.
            </h2>
            <p className="mt-3 text-base leading-7 text-neutral-600 dark:text-zinc-400">
              From a quick city break to a wedding weekend, Itinera helps you shape the timeline,
              capture the details, and hand everyone a plan that feels calm and clear.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {useCaseCards.map((card, index) => (
              <div
                key={card.title}
                className="rounded-[1.8rem] border border-neutral-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                  0{index + 1}
                </span>
                <h3 className="mt-3 text-xl font-semibold text-neutral-950 dark:text-white">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-zinc-400">
                  {card.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        <FeatureShowcaseTabs data={showcaseData} />

        <section
          id="discover"
          className="mt-16 rounded-[2rem] border border-neutral-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/90"
        >
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-zinc-500">
                Explore shared plans
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                Browse itineraries the way a planner actually searches.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-neutral-600 dark:text-zinc-400">
                Filter by trip type, location, vibe, and duration. Keep the Wanderlog-style discovery
                feeling, but centered on the itineraries your community already shares.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {(popularTags.length > 0
                  ? popularTags
                  : ["beach", "city", "road-trip", "wedding", "food", "weekend"]
                ).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <form
              className="rounded-[1.6rem] border border-neutral-200 bg-neutral-50 p-5 dark:border-zinc-800 dark:bg-zinc-950"
              action="/"
              method="get"
            >
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-zinc-500">
                  Trip type
                </legend>
                <TripKindFilterPills
                  variant="discover"
                  kindParam={kindParam}
                  vibe={vibe ?? ""}
                  location={location ?? ""}
                  durationMin={sp.durationMin ?? ""}
                  durationMax={sp.durationMax ?? ""}
                />
              </fieldset>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-zinc-500">
                    Vibe or tag
                  </span>
                  <input
                    name="vibe"
                    defaultValue={vibe}
                    placeholder="luxury, backpacking..."
                    className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-zinc-500">
                    Location
                  </span>
                  <input
                    name="location"
                    defaultValue={location}
                    placeholder="Italy, Napa..."
                    className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-zinc-500">
                    Minimum days
                  </span>
                  <input
                    name="durationMin"
                    defaultValue={sp.durationMin}
                    type="number"
                    min={1}
                    className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-zinc-500">
                    Maximum days
                  </span>
                  <input
                    name="durationMax"
                    defaultValue={sp.durationMax}
                    type="number"
                    min={1}
                    className="rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-sky-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                >
                  Search itineraries
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
                >
                  Reset filters
                </Link>
              </div>
            </form>
          </div>

          {!databaseAvailable ? (
            <div
              className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
              role="alert"
            >
              <p className="font-semibold">Database not reachable</p>
              {onVercel ? (
                <>
                  <p className="mt-1 text-amber-900 dark:text-amber-200/90">
                    This is the deployed app on Vercel. It cannot use{" "}
                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">localhost</code> — there
                    is no database on the server. In{" "}
                    <strong className="font-medium">Vercel → Project → Settings → Environment Variables</strong>,
                    set{" "}
                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">DATABASE_URL</code> to
                    your Neon connection string (host looks like{" "}
                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">ep-....neon.tech</code>),
                    for <strong className="font-medium">Production</strong> and{" "}
                    <strong className="font-medium">Preview</strong> if you use preview URLs. Then click{" "}
                    <strong className="font-medium">Redeploy</strong>. From your PC, run{" "}
                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">npx prisma migrate deploy</code>{" "}
                    once with that same URL.
                  </p>
                  {databaseUrlLooksLocal ? (
                    <p className="mt-2 font-medium text-amber-950 dark:text-amber-50">
                      Your Vercel{" "}
                      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">DATABASE_URL</code>{" "}
                      still mentions localhost or 127.0.0.1 — replace it with the full URI from the
                      Neon dashboard (not your laptop).
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="mt-1 text-amber-900 dark:text-amber-200/90">
                    The app could not open a Postgres connection (often{" "}
                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">localhost:5432</code>). If
                    Docker is already running, try stopping and restarting{" "}
                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">npm run dev</code> so it
                    picks up the database, and use{" "}
                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">127.0.0.1</code> instead of{" "}
                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">localhost</code> in{" "}
                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">DATABASE_URL</code> on
                    Windows.
                  </p>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-amber-900 dark:text-amber-200/90">
                    <li>
                      In this project folder:{" "}
                      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">docker compose up -d</code>
                    </li>
                    <li>
                      Then:{" "}
                      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">
                        npx prisma migrate deploy
                      </code>
                    </li>
                  </ol>
                  <p className="mt-2 text-amber-900 dark:text-amber-200/90">
                    Or point{" "}
                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">DATABASE_URL</code> in{" "}
                    <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">.env</code> at your
                    Postgres instance.
                  </p>
                </>
              )}
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-zinc-500">
                  Trending now
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                  Hot itineraries from the community
                </h3>
              </div>
              {databaseAvailable ? (
                <div className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                  {items.length} plan{items.length === 1 ? "" : "s"} found
                </div>
              ) : null}
            </div>

            {databaseAvailable && items.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
                No public plans match yet.{" "}
                <Link
                  href="/itineraries/new"
                  className="font-medium text-emerald-800 hover:underline dark:text-emerald-400"
                >
                  Publish the first one
                </Link>
                .
              </p>
            ) : !databaseAvailable ? null : (
              <ul className="columns-1 gap-4 [column-gap:1rem] sm:columns-2 xl:columns-3">
                {items.map((item) => (
                  <li key={item.id} className="mb-4 break-inside-avoid">
                    <FeedCard
                      id={item.id}
                      slug={item.slug}
                      title={item.title}
                      summary={item.summary}
                      coverImageUrl={item.coverImageUrl}
                      voteScore={item.voteScore}
                      dayCount={item.dayCount}
                      tags={item.tags}
                      ownerName={item.owner.name}
                      myVote={voteMap.get(item.id) ?? 0}
                      myStarred={starMap.get(item.id) ?? false}
                      previewUrls={item.previewUrls}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <TopCitiesSection cities={cities} />
        <TopAttractionsSection attractions={attractions} />
      </div>
    </div>
  );
}
