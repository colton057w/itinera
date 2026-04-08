"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useId, useMemo, useState, type ComponentType } from "react";
import type { MarketingShowcaseData } from "@/lib/marketing-showcase-types";

type PanelProps = { data: MarketingShowcaseData };

type FeatureTab = {
  id: string;
  label: string;
  short: string;
  headline: string;
  body: string;
  Panel: ComponentType<PanelProps>;
};

function PanelCollaboration({ data }: PanelProps) {
  const has =
    data.collaboration.trips.length > 0 || data.collaboration.guestComments.length > 0;

  if (!has) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {data.isLoggedIn ? "Your workspace" : "Sign in"}
          </p>
          <p className="text-sm text-neutral-600 dark:text-zinc-400">
            {data.isLoggedIn
              ? "When travelers comment on your shared itineraries—or when you fork and remix plans—activity will show here."
              : "Log in to see recent trips, forks, and guest comments on your published guides."}
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-6 text-sm text-neutral-600 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-400">
          <p className="font-medium text-neutral-900 dark:text-zinc-100">Sample collaboration</p>
          <p className="mt-2">
            Share a link, collect comments on specific days, and keep everyone on the same timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-zinc-900">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Your recent trips
        </p>
        <ul className="space-y-2">
          {data.collaboration.trips.map((t, i) => (
            <motion.li
              key={t.slug}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-xl border border-emerald-100 bg-white/95 px-3 py-2.5 text-sm shadow-sm dark:border-emerald-900/30 dark:bg-zinc-950"
            >
              <Link
                href={`/itineraries/${t.slug}`}
                className="font-medium text-neutral-900 hover:underline dark:text-zinc-100"
              >
                {t.title}
              </Link>
              <p className="text-xs text-neutral-500 dark:text-zinc-500">
                Updated {new Date(t.updatedAt).toLocaleDateString()}
                {t.forkCount > 0 ? ` · ${t.forkCount} fork${t.forkCount === 1 ? "" : "s"}` : ""}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-xs font-semibold text-neutral-500 dark:text-zinc-500">Guest comments</p>
        {data.collaboration.guestComments.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600 dark:text-zinc-400">
            No comments from other travelers yet on your public trips.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.collaboration.guestComments.map((c, i) => (
              <motion.li
                key={`${c.createdAt}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i }}
                className="rounded-xl bg-neutral-50 px-3 py-2 text-sm dark:bg-zinc-950"
              >
                <p className="text-xs font-medium text-neutral-500 dark:text-zinc-500">
                  {c.authorName ?? "Traveler"} on {c.itineraryTitle}
                </p>
                <p className="mt-1 text-neutral-800 dark:text-zinc-200">{c.excerpt}</p>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PanelReservations({ data }: PanelProps) {
  const items = data.reservations.items;
  if (items.length === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 dark:border-sky-900/40 dark:from-sky-950/30 dark:to-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
            {data.isLoggedIn ? "No bookings on the timeline yet" : "Your bookings"}
          </p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-zinc-400">
            {data.isLoggedIn
              ? "Add flight and hotel events to your itineraries—they surface here automatically."
              : "Sign in to pull flights and stays from the trips you own."}
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-600 dark:border-zinc-700 dark:text-zinc-400">
          Forwarding confirmations and inbox sync are on the roadmap; today, structured events power this
          view.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
      <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 dark:border-sky-900/40 dark:from-sky-950/30 dark:to-zinc-900">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
          From your itineraries
        </p>
        <div className="mt-3 space-y-2">
          {items.slice(0, 4).map((row, i) => (
            <motion.div
              key={`${row.tripSlug}-${row.title}-${i}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i }}
              className="rounded-xl border border-sky-100 bg-white/95 px-3 py-2.5 text-sm shadow-sm dark:border-sky-900/30 dark:bg-zinc-950"
            >
              <p className="font-medium text-neutral-900 dark:text-zinc-100">{row.title}</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500">
                {row.kind === "flight" ? "Flight" : "Stay"} · {row.detail}
              </p>
              {row.whenLabel ? (
                <p className="mt-1 text-[11px] text-sky-700 dark:text-sky-400">{row.whenLabel}</p>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-xs font-semibold text-neutral-500 dark:text-zinc-500">Open trip</p>
        <div className="mt-4 space-y-2">
          {items.slice(0, 4).map((row, i) => (
            <Link
              key={`link-${row.tripSlug}-${row.title}-${i}`}
              href={`/itineraries/${row.tripSlug}`}
              className="block rounded-xl bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {row.tripTitle}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelFlightStatus({ data }: PanelProps) {
  const flights = data.flights.items;
  const first = flights[0];

  if (!first) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-[linear-gradient(160deg,#0f172a,#1e293b)] p-4 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">Live status</p>
          <p className="mt-4 text-sm text-slate-300">
            {data.isLoggedIn
              ? "Add upcoming flights to your story—or include a carrier code + flight number in the title (e.g. AF 007)—to query Aviationstack when AVIATIONSTACK_API_KEY is set."
              : "Sign in to surface your next flights here. Optional: Aviationstack for live gates and delays."}
          </p>
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-neutral-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm text-neutral-600 dark:text-zinc-400">
            Live lookups are best-effort and respect API quotas; without a key, Itinera still shows your
            scheduled segments from the database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-[linear-gradient(160deg,#0f172a,#1e293b)] p-4 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">Next flight</p>
          {first.live ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                first.live.delay
                  ? "bg-amber-500/25 text-amber-200"
                  : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {first.live.statusText}
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
              {first.flightIata ? "Schedule only" : "Add flight # for live"}
            </span>
          )}
        </div>
        <p className="mt-4 text-2xl font-semibold tracking-tight">{first.title}</p>
        <p className="text-sm text-slate-300">{first.route}</p>
        {first.whenLabel ? <p className="mt-1 text-xs text-slate-400">{first.whenLabel}</p> : null}
        {first.flightIata ? (
          <p className="mt-2 text-xs text-sky-300/90">IATA {first.flightIata}</p>
        ) : null}
        <div className="mt-6 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-lg bg-white/10 px-2 py-2">
            <p className="text-slate-400">Gate</p>
            <p className="mt-1 font-semibold">{first.live?.gate ?? "—"}</p>
          </div>
          <div className="rounded-lg bg-white/10 px-2 py-2">
            <p className="text-slate-400">Terminal</p>
            <p className="mt-1 font-semibold">{first.live?.terminal ?? "—"}</p>
          </div>
        </div>
        <Link
          href={`/itineraries/${first.tripSlug}`}
          className="mt-4 inline-block text-xs font-medium text-sky-300 underline-offset-4 hover:underline"
        >
          Open trip →
        </Link>
      </div>
      <div className="flex flex-col justify-center rounded-2xl border border-neutral-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">Upcoming queue</p>
        <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-zinc-400">
          {flights.map((f, i) => (
            <li key={`${f.tripSlug}-${f.title}-${i}`} className="flex justify-between gap-2">
              <span className="min-w-0 truncate">{f.title}</span>
              <span className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400">
                {f.live?.statusText ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PanelMapRouting({ data }: PanelProps) {
  const m = data.mapRoutes;
  if (!m || m.legs.length === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
        <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 dark:border-zinc-700 dark:bg-zinc-950">
          <p className="max-w-sm px-4 text-center text-sm text-neutral-600 dark:text-zinc-400">
            {data.isLoggedIn
              ? "Pin places on the map when editing events—we’ll estimate hop distances between stops on your most geo-rich trip."
              : "Sign in to preview route-style legs from your own pinned stops."}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-600 dark:border-zinc-700 dark:text-zinc-400">
          Tip: choose “activity” stops with Google Places so lat/lng flow into this view.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
      <div className="relative h-[min(280px,42vw)] min-h-[200px] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-zinc-700 dark:bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(16,185,129,0.2),transparent_45%),radial-gradient(circle_at_70%_55%,rgba(14,165,233,0.18),transparent_40%)]" />
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          <motion.path
            d="M 60 180 Q 140 80 220 140 T 380 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-emerald-500"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </svg>
        <p className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-neutral-800 shadow dark:bg-zinc-900/90 dark:text-zinc-100">
          {m.tripTitle} · {m.stopCount} pinned stops · haversine legs
        </p>
        <Link
          href={`/itineraries/${m.tripSlug}`}
          className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-800 shadow dark:bg-zinc-900/90 dark:text-zinc-100"
        >
          Open
        </Link>
      </div>
      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-500">
          Between stops
        </p>
        {m.legs.map((row) => (
          <div
            key={`${row.from}-${row.to}`}
            className="flex flex-col gap-1 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <span className="text-neutral-800 dark:text-zinc-200">
              {row.from} → {row.to}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelDeals({ data }: PanelProps) {
  const deals = data.deals;
  const preview = deals[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-white p-4 dark:border-violet-900/40 dark:from-violet-950/30 dark:to-zinc-900">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
          Deals digest
        </p>
        <p className="mt-2 text-sm text-neutral-700 dark:text-zinc-300">
          Rows come from the <code className="rounded bg-violet-100 px-1 dark:bg-violet-950">MarketFlightDeal</code>{" "}
          table (filled by <code className="rounded bg-violet-100 px-1 dark:bg-violet-950">prisma db seed</code>
          ). Refresh them anytime from your own admin, ETL, or a fare API you choose.
        </p>
        <motion.ul
          className="mt-4 space-y-2"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {deals.slice(0, 6).map((d, i) => (
            <motion.li
              key={`${d.headline}-${d.source}-${i}`}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
              className="flex items-center justify-between rounded-xl border border-violet-100 bg-white px-3 py-2 text-sm dark:border-violet-900/30 dark:bg-zinc-950"
            >
              <div className="min-w-0">
                <span className="font-medium text-neutral-900 dark:text-zinc-100">{d.headline}</span>
                {d.subline ? (
                  <p className="truncate text-xs text-neutral-500 dark:text-zinc-500">{d.subline}</p>
                ) : null}
              </div>
              <span className="shrink-0 pl-2 text-right text-xs text-violet-600 dark:text-violet-400">
                {d.priceHint ?? d.tag ?? d.source}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
          <p className="text-xs text-neutral-500 dark:text-zinc-500">Spotlight</p>
          {preview ? (
            <>
              <p className="mt-2 text-sm font-semibold text-neutral-900 dark:text-zinc-100">
                {preview.headline}
              </p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-zinc-400">
                {preview.subline ?? preview.priceHint ?? "Curated for the homepage feed."}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Source: {preview.source}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-neutral-600 dark:text-zinc-400">No rows yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const TAB_DEFS: FeatureTab[] = [
  {
    id: "collab",
    label: "Collaboration",
    short: "Plan together in real time",
    headline: "Collaborate with friends in real time",
    body: "Comments on your shared trips and forks of your plans show up here when you’re signed in.",
    Panel: PanelCollaboration,
  },
  {
    id: "reservations",
    label: "Reservations",
    short: "Flights & hotels in one place",
    headline: "Flights and hotels from your timelines",
    body: "Structured flight and hotel events on your own itineraries power this panel—no mailbox access required yet.",
    Panel: PanelReservations,
  },
  {
    id: "flight",
    label: "Flight status",
    short: "Live gates & delays",
    headline: "Track live flight status",
    body: "We read your next segments from Postgres and optionally enrich them with Aviationstack when a flight number is detectable and AVIATIONSTACK_API_KEY is set.",
    Panel: PanelFlightStatus,
  },
  {
    id: "map",
    label: "Map & routing",
    short: "Optimize your day",
    headline: "Map every stop and estimate legs",
    body: "When events include coordinates, we chain them in day order and estimate distance and drive time between stops.",
    Panel: PanelMapRouting,
  },
  {
    id: "deals",
    label: "Flight deals",
    short: "Your database",
    headline: "Deals backed by data",
    body: "Seed rows ship with the repo. Amadeus self-service signup is being retired (portal decommission July 2026), so we keep deals as plain Postgres rows you can update or sync from any provider.",
    Panel: PanelDeals,
  },
];

export function FeatureShowcaseTabs({ data }: { data: MarketingShowcaseData }) {
  const baseId = useId();
  const [selectedId, setSelectedId] = useState(TAB_DEFS[0].id);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const tabs = useMemo(() => TAB_DEFS, []);

  const displayed = hoverId ?? selectedId;
  const activeTab = tabs.find((t) => t.id === displayed) ?? tabs[0];
  const ActivePanel = activeTab.Panel;

  const onLeaveRow = useCallback(() => setHoverId(null), []);

  return (
    <section className="relative mt-20 overflow-hidden rounded-[2rem] border border-neutral-200/90 bg-white/95 p-6 shadow-[0_32px_120px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900/95 dark:shadow-[0_32px_120px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/10" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-500/10" />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
          Everything in one workspace
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
          The trip planner travelers wish they had years ago
        </h2>
        <p className="mt-3 text-base leading-7 text-neutral-600 dark:text-zinc-400">
          Hover a feature to preview it, click to lock your selection — panels prefer{" "}
          <strong className="font-medium text-neutral-800 dark:text-zinc-200">your real itineraries</strong>{" "}
          when you’re signed in.
        </p>
      </div>

      <div className="relative mx-auto mt-10 max-w-5xl" onMouseLeave={onLeaveRow}>
        <div
          className="flex flex-wrap items-center justify-center gap-1 sm:gap-2"
          role="tablist"
          aria-label="Product features"
        >
          {tabs.map((tab) => {
            const isActive = displayed === tab.id;
            return (
              <div key={tab.id} className="relative">
                <button
                  type="button"
                  role="tab"
                  id={`${baseId}-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`${baseId}-panel`}
                  onMouseEnter={() => setHoverId(tab.id)}
                  onFocus={() => setHoverId(tab.id)}
                  onBlur={() => setHoverId(null)}
                  onClick={() => {
                    setSelectedId(tab.id);
                    setHoverId(null);
                  }}
                  className={`relative z-10 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    isActive
                      ? "text-neutral-950 dark:text-white"
                      : "text-neutral-500 hover:text-neutral-800 dark:text-zinc-500 dark:hover:text-zinc-200"
                  }`}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="feature-tab-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-neutral-100 shadow-inner dark:bg-zinc-800"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <span className="relative">{tab.label}</span>
                </button>

                <AnimatePresence>
                  {hoverId === tab.id && selectedId !== tab.id ? (
                    <motion.div
                      role="tooltip"
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-1/2 top-[calc(100%+6px)] z-20 w-max max-w-[min(280px,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-neutral-200/90 bg-white px-3 py-2 text-left text-xs text-neutral-600 shadow-xl dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      <p className="font-semibold text-neutral-900 dark:text-zinc-100">{tab.label}</p>
                      <p className="mt-0.5 leading-snug">{tab.short}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-${activeTab.id}`}
          className="mt-10 rounded-[1.5rem] border border-neutral-200/80 bg-gradient-to-b from-neutral-50/80 to-white p-5 sm:p-8 dark:border-zinc-700 dark:from-zinc-950 dark:to-zinc-900"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                {activeTab.headline}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-zinc-400">
                {activeTab.body}
              </p>
              <div className="mt-8">
                <ActivePanel data={data} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
