import Image from "next/image";
import Link from "next/link";
import type { CuratedAttraction } from "@/lib/curated-types";

export function TopAttractionsSection({ attractions }: { attractions: CuratedAttraction[] }) {
  return (
    <section className="mt-20 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-400">
            Top attractions
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Iconic places — jump into a full city guide
          </h2>
          <p className="mt-2 text-base leading-7 text-neutral-600 dark:text-zinc-400">
            Rows are stored in Postgres and ordered with the seed script—swap images or titles anytime via
            your own admin or migrations.
          </p>
        </div>
        <Link
          href="#discover"
          className="shrink-0 text-sm font-semibold text-neutral-700 underline-offset-4 hover:underline dark:text-zinc-300"
        >
          Or browse community itineraries ↑
        </Link>
      </div>

      <div className="mt-8 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
        {attractions.map((a, i) => (
          <Link
            key={a.id}
            href={`/explore/${a.citySlug}`}
            scroll={false}
            className="group relative w-[min(200px,72vw)] shrink-0 overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 sm:w-auto"
          >
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={a.image}
                alt=""
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="200px"
                priority={i < 3}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  {a.city}
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-snug">{a.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
