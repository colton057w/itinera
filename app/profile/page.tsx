import { Visibility } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteItineraryButton } from "@/components/itinerary/DeleteItineraryButton";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

export const metadata = {
  title: "Your profile · Itinera",
};

function formatJoinDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      emailVerified: true,
      _count: {
        select: {
          itineraries: true,
          votes: true,
          comments: true,
          starred: true,
        },
      },
      starred: {
        orderBy: { createdAt: "desc" },
        take: 24,
        select: {
          createdAt: true,
          itinerary: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
              visibility: true,
              owner: { select: { name: true } },
              _count: { select: { days: true } },
            },
          },
        },
      },
      itineraries: {
        orderBy: { updatedAt: "desc" },
        take: 24,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          coverImageUrl: true,
          visibility: true,
          voteScore: true,
          updatedAt: true,
          _count: { select: { days: true } },
        },
      },
    },
  });

  if (!user) {
    redirect("/login?callbackUrl=/profile");
  }

  const displayName = user.name ?? user.email?.split("@")[0] ?? "Traveler";
  const initial = (displayName.slice(0, 1) || "?").toUpperCase();

  const stats = [
    { label: "Itineraries", value: user._count.itineraries },
    { label: "Starred", value: user._count.starred },
    { label: "Votes cast", value: user._count.votes },
    { label: "Comments", value: user._count.comments },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-24 bg-gradient-to-br from-emerald-600/90 via-teal-600/80 to-zinc-800 dark:from-emerald-900/80 dark:via-teal-900/60 dark:to-zinc-950" />
        <div className="relative px-6 pb-6 pt-0">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-neutral-200 text-2xl font-semibold text-neutral-600 shadow-md dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-200">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-zinc-50">
                  {displayName}
                </h1>
                {user.email ? (
                  <p className="mt-0.5 text-sm text-neutral-600 dark:text-zinc-400">{user.email}</p>
                ) : null}
                <p className="mt-1 text-xs text-neutral-500 dark:text-zinc-500">
                  Member since {formatJoinDate(user.createdAt)}
                  {user.emailVerified ? (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Verified email
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <Link
              href="/itineraries/new"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              New itinerary
            </Link>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-6 sm:grid-cols-4 dark:border-zinc-800">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-neutral-50 px-3 py-3 text-center dark:bg-zinc-800/60"
              >
                <dd className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-zinc-100">
                  {s.value}
                </dd>
                <dt className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-zinc-400">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {user.starred.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-zinc-100">
            Starred itineraries
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-zinc-400">
            Trips you saved from the feed — quick links to revisit or clone.
          </p>
          <ul className="mt-4 space-y-2">
            {user.starred.map((row) => (
              <li key={`${row.itinerary.id}-${row.createdAt.toISOString()}`}>
                <Link
                  href={`/itineraries/${row.itinerary.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5 text-sm transition hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:bg-amber-950/35"
                >
                  <span className="text-amber-600 dark:text-amber-400" aria-hidden>
                    ★
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-neutral-900 dark:text-zinc-100">
                      {row.itinerary.title}
                    </span>
                    <span className="ml-2 text-xs text-neutral-500 dark:text-zinc-500">
                      {row.itinerary._count.days} days · {row.itinerary.owner.name ?? "Planner"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-zinc-100">
              Your itineraries
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-zinc-400">
              Plans you have published or keep private. Delete a plan you no longer need.
            </p>
          </div>
        </div>

        {user.itineraries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <p className="text-sm text-neutral-600 dark:text-zinc-400">
              You have not published an itinerary yet.
            </p>
            <Link
              href="/itineraries/new"
              className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Create your first plan →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {user.itineraries.map((it) => (
              <li key={it.id} className="flex gap-2">
                <Link
                  href={`/itineraries/${it.slug}`}
                  className="flex min-w-0 flex-1 gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-zinc-800">
                    {it.coverImageUrl ? (
                      <Image
                        src={it.coverImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-neutral-400 dark:text-zinc-500">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-neutral-900 dark:text-zinc-100">
                        {it.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          it.visibility === Visibility.PUBLIC
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
                            : "bg-neutral-200 text-neutral-800 dark:bg-zinc-700 dark:text-zinc-200"
                        }`}
                      >
                        {it.visibility === Visibility.PUBLIC ? "Public" : "Private"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-zinc-500">
                      {it._count.days} days · {it.voteScore} pts · Updated{" "}
                      {it.updatedAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {it.summary ? (
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-zinc-400">
                        {it.summary}
                      </p>
                    ) : null}
                  </div>
                </Link>
                <DeleteItineraryButton
                  itineraryId={it.id}
                  redirectTo="/profile"
                  variant="compact"
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
