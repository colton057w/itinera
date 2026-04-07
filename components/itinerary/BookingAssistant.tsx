"use client";

import { useMemo, useState } from "react";
import type { BookingPlan } from "@/lib/booking-options";

type Props = {
  itineraryId: string;
};

export function BookingAssistant({ itineraryId }: Props) {
  const [partySize, setPartySize] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<BookingPlan | null>(null);

  const summary = useMemo(() => {
    if (!plan) return null;
    return [
      plan.meta.flightCount ? `${plan.meta.flightCount} flight${plan.meta.flightCount === 1 ? "" : "s"}` : null,
      plan.meta.stayCount ? `${plan.meta.stayCount} stay${plan.meta.stayCount === 1 ? "" : "s"}` : null,
      plan.meta.venueCount ? `${plan.meta.venueCount} venue${plan.meta.venueCount === 1 ? "" : "s"}` : null,
    ]
      .filter(Boolean)
      .join(" | ");
  }, [plan]);

  async function loadPlan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}/booking-options?partySize=${partySize}`);
      const body = (await res.json().catch(() => null)) as BookingPlan | { error?: string } | null;
      if (!res.ok) {
        setError(body && "error" in body && body.error ? body.error : "Failed to generate booking links.");
        setPlan(null);
        return;
      }

      setPlan(body as BookingPlan);
    } catch {
      setError("Failed to generate booking links.");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }

  function openBookingStack() {
    if (!plan) return;
    for (const link of plan.tripLinks) {
      window.open(link.href, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            One-click booking
          </p>
          <h2 className="mt-1 text-xl font-semibold text-neutral-900 dark:text-zinc-100">
            Turn this itinerary into live flight, stay, and venue searches.
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-zinc-400">
            Itinera reads the itinerary timeline and builds provider-ready links for flights, hotels,
            and reservation stops. Travelpayouts flight price hints appear automatically when a token is configured.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-neutral-600 dark:text-zinc-400">
            Travelers
            <select
              value={partySize}
              onChange={(e) => setPartySize(Number.parseInt(e.target.value, 10))}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void loadPlan()}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {loading ? "Building booking links..." : plan ? "Refresh booking links" : "Build booking links"}
          </button>
          {plan?.tripLinks.length ? (
            <button
              type="button"
              onClick={openBookingStack}
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60"
            >
              Open booking stack
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </p>
      ) : null}

      {plan ? (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-zinc-400">
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-800 dark:bg-zinc-800 dark:text-zinc-200">
              {summary || "Booking links ready"}
            </span>
            {plan.meta.livePriceCount ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
                {plan.meta.livePriceCount} live Travelpayouts price hint{plan.meta.livePriceCount === 1 ? "" : "s"}
              </span>
            ) : null}
            <span className="text-xs">
              {plan.partySize} traveler{plan.partySize === 1 ? "" : "s"} | {plan.roomCount} room
            </span>
          </div>
          <p className="text-xs leading-5 text-neutral-500 dark:text-zinc-500">
            External sites don&apos;t always honor traveler or party size from the link. After each page loads, confirm
            guests or covers match{" "}
            <span className="font-medium text-neutral-700 dark:text-zinc-400">{plan.partySize}</span> before you book.
          </p>

          {plan.warnings.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              <ul className="space-y-1">
                {plan.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-4">
            {plan.groups.map((group) => (
              <div key={group.kind} className="rounded-2xl border border-neutral-200/80 p-4 dark:border-zinc-800">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-zinc-100">{group.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-zinc-400">{group.description}</p>
                </div>

                <div className="space-y-3">
                  {group.items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-semibold text-neutral-900 dark:text-zinc-100">
                              {item.title}
                            </h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                item.readiness === "ready"
                                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                                  : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                              }`}
                            >
                              {item.readiness === "ready" ? "ready" : "needs details"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-neutral-700 dark:text-zinc-300">{item.detail}</p>
                          {item.timing ? (
                            <p className="mt-1 text-sm text-neutral-500 dark:text-zinc-400">{item.timing}</p>
                          ) : null}
                          <p className="mt-2 text-sm text-neutral-600 dark:text-zinc-400">{item.note}</p>
                          {item.priceHint ? (
                            <p className="mt-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                              {item.priceHint}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.links.map((link, index) => (
                          <a
                            key={`${item.id}-${link.href}-${index}`}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={
                              index === 0
                                ? "inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                                : "inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                            }
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
