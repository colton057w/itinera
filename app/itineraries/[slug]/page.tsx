import { Visibility } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentsSection } from "@/components/feed/CommentsSection";
import { VoteControl } from "@/components/feed/VoteControl";
import { buildCommentTree } from "@/lib/comments";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { CloneButton } from "@/components/itinerary/CloneButton";
import { DeleteItineraryButton } from "@/components/itinerary/DeleteItineraryButton";
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
    include: { author: { select: { id: true, name: true, image: true } } },
  });
  const commentTree = buildCommentTree(commentRows);

  const showForkLink =
    it.forkedFrom &&
    (it.forkedFrom.visibility === Visibility.PUBLIC ||
      (session?.user?.id &&
        (session.user.id === it.forkedFrom.ownerId ||
          session.user.id === it.ownerId)));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
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
          <p className="mt-1 text-sm text-neutral-600 dark:text-zinc-400">
            By {it.owner.name ?? "Planner"}
            {it.days.length ? ` · ${it.days.length} days` : null}
          </p>
          {it.forkedFrom ? (
            <p className="mt-3 text-sm text-neutral-600 dark:text-zinc-400">
              Cloned from{" "}
              {showForkLink ? (
                <Link
                  href={`/itineraries/${it.forkedFrom.slug}`}
                  className="font-medium text-emerald-800 hover:underline dark:text-emerald-400"
                >
                  {it.forkedFrom.title}
                </Link>
              ) : (
                <span className="font-medium">a private itinerary</span>
              )}{" "}
              {showForkLink ? (
                <>by {it.forkedFrom.owner.name ?? "another planner"}</>
              ) : null}
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

      {it.coverImageUrl ? (
        <div className="relative mt-8 aspect-[21/9] w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-zinc-800">
          <Image
            src={it.coverImageUrl}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <CloneButton sourceId={it.id} />
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

      <section className="mt-12 space-y-10">
        {it.days.map((day) => (
          <div key={day.id}>
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
            <ul className="mt-4 space-y-6">
              {day.events.map((ev) => (
                <li
                  key={ev.id}
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
                      <EventPlaceLinks
                        type={ev.type}
                        title={ev.title}
                        location={ev.location}
                        googlePlaceId={ev.googlePlaceId}
                        googleMapsUrl={ev.googleMapsUrl}
                        websiteUrl={ev.websiteUrl}
                        lat={ev.lat}
                        lng={ev.lng}
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
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <CommentsSection itineraryId={it.id} initialComments={commentTree} />
    </div>
  );
}
