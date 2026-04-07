import { TripKind, Visibility } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentsSection } from "@/components/feed/CommentsSection";
import { TripCoverVisual } from "@/components/feed/TripCoverVisual";
import { VoteControl } from "@/components/feed/VoteControl";
import { buildCommentTree } from "@/lib/comments";
import { buildItineraryMapPoints } from "@/lib/buildItineraryMapPoints";
import { highSpendEventIds } from "@/lib/budgetHighlights";
import { formatMinorUnits } from "@/lib/formatMoney";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { venueClosureHint } from "@/lib/venueClosureHints";
import { isWeddingStyleTrip } from "@/lib/weddingItinerary";
import { BookTripPanel } from "@/components/itinerary/BookTripPanel";
import { BudgetSummary } from "@/components/itinerary/BudgetSummary";
import { CloneButton } from "@/components/itinerary/CloneButton";
import { DeleteItineraryButton } from "@/components/itinerary/DeleteItineraryButton";
import { ForkVariationsSection } from "@/components/itinerary/ForkVariationsSection";
import { EventMapHighlight } from "@/components/itinerary/itinerary-map/EventMapHighlight";
import { ItineraryMapLayout } from "@/components/itinerary/itinerary-map/ItineraryMapLayout";
import { EventPlaceLinks } from "@/components/itinerary/EventPlaceLinks";
import { ItineraryStarButton } from "@/components/itinerary/ItineraryStarButton";
import { StarRating } from "@/components/itinerary/StarRating";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const it = await prisma.itinerary.findUnique({
    where: { slug },
    select: { title: true },
  });
  return { title: it ? `${it.title} · Itinera` : "Itinera" };
}

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const it = await prisma.itinerary.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      tags: { include: { tag: true } },
      forkedFrom: {
        select: {
          id: true,
          title: true,
          slug: true,
          visibility: true,
          ownerId: true,
          owner: { select: { id: true, name: true } },
        },
      },
      days: {
        orderBy: { dayIndex: "asc" },
        include: {
          events: {
            orderBy: { eventIndex: "asc" },
            include: { media: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });

  if (!it) notFound();

  const canView =
    it.visibility === Visibility.PUBLIC ||
    (session?.user?.id && session.user.id === it.ownerId);
  if (!canView) notFound();

  let myVote = 0;
  let myStarred = false;
  if (session?.user?.id) {
    const [v, star] = await Promise.all([
      prisma.vote.findUnique({
        where: {
          userId_itineraryId: {
            userId: session.user.id,
            itineraryId: it.id,
          },
        },
      }),
      prisma.itineraryStar.findUnique({
        where: {
          userId_itineraryId: {
            userId: session.user.id,
            itineraryId: it.id,
          },
        },
        select: { userId: true },
      }),
    ]);
    myVote = v?.value ?? 0;
    myStarred = Boolean(star);
  }

  const commentRows = await prisma.comment.findMany({
    where: { itineraryId: it.id },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, image: true } },
      ...(session?.user?.id
        ? {
            votes: {
              where: { userId: session.user.id },
              select: { value: true },
              take: 1,
            },
          }
        : {}),
    },
  });
  const commentTree = buildCommentTree(commentRows);

  const mapPoints = buildItineraryMapPoints(it.days);

  const tagNames = it.tags.map((t) => t.tag.name);
  const guestPortalEligible =
    it.visibility === Visibility.PUBLIC &&
    isWeddingStyleTrip({ tripKind: it.tripKind, tagNames, title: it.title });

  const budgetLines = it.days.flatMap((day) =>
    day.events
      .filter(
        (ev) =>
          ev.estimatedCostMinor != null &&
          ev.estimatedCostMinor > 0 &&
          ev.currency != null &&
          ev.currency.trim() !== "",
      )
      .map((ev) => ({
        id: ev.id,
        title: ev.title,
        type: ev.type,
        minor: ev.estimatedCostMinor!,
        currency: ev.currency!.trim(),
      })),
  );
  const highSpend = highSpendEventIds(
    budgetLines.map(({ id, minor, currency }) => ({ id, minor, currency })),
  );

  const showForkLink =
    it.forkedFrom &&
    (it.forkedFrom.visibility === Visibility.PUBLIC ||
      (session?.user?.id &&
        (session.user.id === it.forkedFrom.ownerId ||
          session.user.id === it.ownerId)));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start">
        <div className="min-w-0">
          <div className="flex gap-4">
            <VoteControl
              itineraryId={it.id}
              initialScore={it.voteScore}
              initialMyVote={myVote}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {it.visibility === Visibility.PUBLIC ? "Public itinerary" : "Private"}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-zinc-100">
                {it.title}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600 dark:text-zinc-400">
                <span>
                  By {it.owner.name ?? "Planner"}
                  {it.days.length ? ` · ${it.days.length} days` : null}
                </span>
                {it.tripKind === TripKind.WEDDING_EVENT ? (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                    Wedding / event
                  </span>
                ) : (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-900 dark:bg-sky-950/50 dark:text-sky-200">
                    Vacation
                  </span>
                )}
              </p>
              {it.forkedFrom || it.cloneSourceAuthorName ? (
                <p className="mt-3 text-sm text-neutral-600 dark:text-zinc-400">
                  Cloned from{" "}
                  <span className="font-medium text-neutral-800 dark:text-zinc-200">
                    {it.cloneSourceAuthorName ?? it.forkedFrom?.owner.name ?? "another planner"}
                  </span>
                  {it.forkedFrom ? (
                    showForkLink ? (
                      <>
                        {" · "}
                        <Link
                          href={`/itineraries/${it.forkedFrom.slug}`}
                          className="text-emerald-800 hover:underline dark:text-emerald-400"
                        >
                          {it.forkedFrom.title}
                        </Link>
                      </>
                    ) : (
                      <span className="text-neutral-500 dark:text-zinc-500">
                        {" "}
                        (original trip is private)
                      </span>
                    )
                  ) : (
                    <span className="text-neutral-500 dark:text-zinc-500">
                      {" "}
                      (original no longer available)
                    </span>
                  )}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {it.tags.map((t) => (
                  <span
                    key={t.tagId}
                    className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
                  >
                    #{t.tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <TripCoverVisual
        className="mt-8"
        variant="hero"
        coverImageUrl={it.coverImageUrl}
        title={it.title}
        summary={it.summary}
        tags={it.tags.map((t) => t.tag.name)}
        priority
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <CloneButton
          sourceId={it.id}
          premiumCloneEnabled={it.premiumCloneEnabled}
          premiumClonePriceCents={it.premiumClonePriceCents}
          premiumCloneCurrency={it.premiumCloneCurrency}
          skipPremiumGate={session?.user?.id === it.ownerId}
        />
        {guestPortalEligible ? (
          <Link
            href={`/itineraries/${it.slug}/guest`}
            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100 dark:hover:bg-rose-950/60"
          >
            Guest view
          </Link>
        ) : null}
        <ItineraryStarButton itineraryId={it.id} initialStarred={myStarred} />
        {session?.user?.id === it.ownerId ? (
          <>
            <Link
              href={`/itineraries/${it.slug}/edit`}
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Edit itinerary
            </Link>
            <DeleteItineraryButton itineraryId={it.id} redirectTo="/profile" />
            <span className="text-sm text-neutral-500 dark:text-zinc-400">You own this plan</span>
          </>
        ) : null}
      </div>

      <ItineraryMapLayout points={mapPoints}>
        {it.days.map((day) => (
          <section
            key={day.id}
            id={`itinerary-day-${day.dayIndex}`}
            className="scroll-mt-24"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-zinc-100">
              {day.label ?? `Day ${day.dayIndex + 1}`}
              {day.date
                ? ` · ${day.date.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}`
                : null}
            </h2>
            <ul className="mt-4 list-none space-y-6">
              {day.events.map((ev) => {
                const closureAt =
                  ev.startsAt ??
                  (day.date
                    ? new Date(
                        Date.UTC(
                          day.date.getUTCFullYear(),
                          day.date.getUTCMonth(),
                          day.date.getUTCDate(),
                          12,
                        ),
                      )
                    : null);
                const closureHint = venueClosureHint({
                  type: ev.type,
                  title: ev.title,
                  at: closureAt,
                });
                return (
                <li key={ev.id}>
                  <EventMapHighlight
                    eventId={ev.id}
                    hasCoords={ev.lat != null && ev.lng != null}
                    label={ev.title}
                    budgetHighSpend={highSpend.has(ev.id)}
                    className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="grid gap-4 p-4 md:grid-cols-[120px_1fr]">
                    <div className="relative h-28 w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-zinc-800 md:h-full md:min-h-[100px]">
                      {ev.coverImageUrl ? (
                        <Image
                          src={ev.coverImageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-neutral-400 dark:text-zinc-500">
                          No photo
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-zinc-400">
                        {ev.type.replaceAll("_", " ")}
                      </p>
                      <h3 className="text-xl font-medium text-neutral-900 dark:text-zinc-100">
                        {ev.title}
                      </h3>
                      {ev.estimatedCostMinor != null &&
                      ev.estimatedCostMinor > 0 &&
                      ev.currency != null &&
                      ev.currency.trim() !== "" ? (
                        <p className="mt-1 text-sm tabular-nums text-neutral-600 dark:text-zinc-400">
                          Est. {formatMinorUnits(ev.estimatedCostMinor, ev.currency.trim())}
                        </p>
                      ) : null}
                      {closureHint ? (
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-200/90">
                          {closureHint}
                        </p>
                      ) : null}
                      <EventPlaceLinks
                        type={ev.type}
                        title={ev.title}
                        location={ev.location}
                        googlePlaceId={ev.googlePlaceId}
                        googleMapsUrl={ev.googleMapsUrl}
                        websiteUrl={ev.websiteUrl}
                        lat={ev.lat}
                        lng={ev.lng}
                        departureAirportCode={ev.departureAirportCode}
                        arrivalAirportCode={ev.arrivalAirportCode}
                        startsAt={ev.startsAt}
                        endsAt={ev.endsAt}
                        dayDate={day.date}
                      />
                      {ev.type === "FLIGHT" &&
                      (ev.departureAirportCode ||
                        ev.arrivalAirportCode ||
                        ev.airline ||
                        ev.startsAt ||
                        ev.endsAt) ? (
                        <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-sm text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
                          {ev.airline ? (
                            <p className="font-medium text-sky-900 dark:text-sky-200">{ev.airline}</p>
                          ) : null}
                          {(ev.departureAirportCode || ev.arrivalAirportCode) && (
                            <p className="mt-1 font-mono text-base font-semibold tracking-wide">
                              {ev.departureAirportCode ?? "—"}
                              {ev.departureAirportName ? (
                                <span className="ml-1 font-sans text-sm font-normal text-sky-800 dark:text-sky-300">
                                  ({ev.departureAirportName})
                                </span>
                              ) : null}
                              <span className="mx-2 text-sky-600 dark:text-sky-400">→</span>
                              {ev.arrivalAirportCode ?? "—"}
                              {ev.arrivalAirportName ? (
                                <span className="ml-1 font-sans text-sm font-normal text-sky-800 dark:text-sky-300">
                                  ({ev.arrivalAirportName})
                                </span>
                              ) : null}
                            </p>
                          )}
                          {(ev.startsAt || ev.endsAt) && (
                            <p className="mt-2 text-xs text-sky-800 dark:text-sky-300">
                              {ev.startsAt ? (
                                <>
                                  <span className="font-medium">Departs:</span>{" "}
                                  {ev.startsAt.toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </>
                              ) : null}
                              {ev.startsAt && ev.endsAt ? " · " : null}
                              {ev.endsAt ? (
                                <>
                                  <span className="font-medium">Arrives:</span>{" "}
                                  {ev.endsAt.toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </>
                              ) : null}
                            </p>
                          )}
                        </div>
                      ) : null}
                      {ev.ratingStars != null && ev.ratingStars >= 1 && ev.ratingStars <= 5 ? (
                        <div className="mt-2">
                          <StarRating
                            value={ev.ratingStars}
                            readOnly
                            label="Planner rating"
                          />
                        </div>
                      ) : null}
                      {ev.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-zinc-300">
                          {ev.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {ev.media.length > 1 ? (
                    <div className="grid grid-cols-3 gap-1 border-t border-neutral-100 bg-neutral-50 p-2 dark:border-zinc-800 dark:bg-zinc-800/50">
                      {ev.media.map((m) => (
                        <div key={m.id} className="relative aspect-video overflow-hidden rounded-lg">
                          <Image
                            src={m.url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  </EventMapHighlight>
                </li>
              );
              })}
            </ul>
          </section>
        ))}
      </ItineraryMapLayout>

      <CommentsSection
        itineraryId={it.id}
        initialComments={commentTree}
        days={it.days.map((d) => ({
          dayIndex: d.dayIndex,
          label: d.label ?? `Day ${d.dayIndex + 1}`,
        }))}
      />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <BookTripPanel days={it.days} />
          <BudgetSummary lines={budgetLines} />
          {it.visibility === Visibility.PUBLIC ? (
            <ForkVariationsSection itineraryId={it.id} />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
