import Link from "next/link";
import { FeedCard } from "@/components/feed/FeedCard";
import { queryFeed, type TripKindFilter } from "@/lib/feed";
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

  const kindParam =
    sp.kind === "vacation" || sp.kind === "wedding" ? sp.kind : "";

  const onVercel = process.env.VERCEL === "1";
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const databaseUrlLooksLocal =
    databaseUrl.length > 0 && /localhost|127\.0\.0\.1/i.test(databaseUrl);

  const { items, databaseAvailable } = await queryFeed({
    vibe: vibe ?? null,
    location: location ?? null,
    durationMin: durationMin && !Number.isNaN(durationMin) ? durationMin : null,
    durationMax: durationMax && !Number.isNaN(durationMax) ? durationMax : null,
    tripKind,
  });

  const session = await auth();
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-zinc-100">
          Itinera
        </h1>
        <p className="mt-2 max-w-xl text-sm text-neutral-600 dark:text-zinc-400">
          Discover and clone trip and wedding timelines — rehearsal dinners, flights, stays, and
          day-by-day stories shared by real planners.
        </p>
      </header>

      <form
        className="mb-8 flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:flex-wrap sm:items-end"
        action="/"
        method="get"
      >
        <fieldset className="min-w-full sm:min-w-0 sm:flex-[1_1_100%]">
          <legend className="text-xs font-medium text-neutral-500 dark:text-zinc-400">
            Trip type
          </legend>
          <div className="mt-1.5 inline-flex rounded-full border border-neutral-200 bg-neutral-50/80 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/60">
            {(
              [
                { value: "", label: "All trips" },
                { value: "vacation", label: "Vacations" },
                { value: "wedding", label: "Weddings & events" },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value || "all"}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  kindParam === opt.value
                    ? "bg-white text-neutral-900 shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <input
                  type="radio"
                  name="kind"
                  value={opt.value}
                  defaultChecked={kindParam === opt.value}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex min-w-[8rem] flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-neutral-500 dark:text-zinc-400">Vibe / tag</span>
          <input
            name="vibe"
            defaultValue={vibe}
            placeholder="luxury, backpacking…"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </label>
        <label className="flex min-w-[8rem] flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-neutral-500 dark:text-zinc-400">Location</span>
          <input
            name="location"
            defaultValue={location}
            placeholder="Italy, Napa…"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </label>
        <label className="flex w-24 flex-col gap-1">
          <span className="text-xs font-medium text-neutral-500 dark:text-zinc-400">Min days</span>
          <input
            name="durationMin"
            defaultValue={sp.durationMin}
            type="number"
            min={1}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <label className="flex w-24 flex-col gap-1">
          <span className="text-xs font-medium text-neutral-500 dark:text-zinc-400">Max days</span>
          <input
            name="durationMax"
            defaultValue={sp.durationMax}
            type="number"
            min={1}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Search
        </button>
        <Link
          href="/"
          className="text-center text-sm font-medium text-neutral-600 hover:underline dark:text-zinc-400 sm:ml-2"
        >
          Reset
        </Link>
      </form>

      {!databaseAvailable ? (
        <div
          className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          <p className="font-semibold">Database not reachable</p>
          {onVercel ? (
            <>
              <p className="mt-1 text-amber-900 dark:text-amber-200/90">
                This is the deployed app on Vercel. It cannot use{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">localhost</code> — there is
                no database on the server. In{" "}
                <strong className="font-medium">Vercel → Project → Settings → Environment Variables</strong>,
                set <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">DATABASE_URL</code> to your
                Neon connection string (host looks like{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">ep-….neon.tech</code>), for{" "}
                <strong className="font-medium">Production</strong> and{" "}
                <strong className="font-medium">Preview</strong> if you use preview URLs. Then click{" "}
                <strong className="font-medium">Redeploy</strong>. From your PC, run{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">npx prisma migrate deploy</code>{" "}
                once with that same URL.
              </p>
              {databaseUrlLooksLocal ? (
                <p className="mt-2 font-medium text-amber-950 dark:text-amber-50">
                  Your Vercel <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">DATABASE_URL</code>{" "}
                  still mentions localhost or 127.0.0.1 — replace it with the full URI from the Neon dashboard
                  (not your laptop).
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-1 text-amber-900 dark:text-amber-200/90">
                The app could not open a Postgres connection (often{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">localhost:5432</code>). If
                Docker is already running, try stopping and restarting{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">npm run dev</code> so it picks
                up the database, and use{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">127.0.0.1</code> instead of{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">localhost</code> in{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">DATABASE_URL</code> on Windows.
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
                Or point <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">DATABASE_URL</code> in{" "}
                <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">.env</code> at your Postgres
                instance.
              </p>
            </>
          )}
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-zinc-500">
          Hot itineraries
        </h2>
        {databaseAvailable && items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
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
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
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
    </div>
  );
}
