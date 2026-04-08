import Image from "next/image";
import Link from "next/link";
import type { CuratedCity } from "@/lib/curated-types";

export function TopCitiesSection({ cities }: { cities: CuratedCity[] }) {
  return (
    <section
      id="top-cities"
      className="mt-24 scroll-mt-8 border-t border-neutral-200/80 pt-16 dark:border-zinc-800"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-400">
          Top cities to visit
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
          Curated guides with experiences you can drop into a trip
        </h2>
        <p className="mt-3 text-base leading-7 text-neutral-600 dark:text-zinc-400">
          Loaded from your database (seed with{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-zinc-800">prisma db seed</code>
          ). Tap a city for photography, hand-picked stops, and one-click adds to your Itinera story.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city, i) => (
          <Link
            key={city.slug}
            href={`/explore/${city.slug}`}
            scroll={false}
            className="group relative overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-neutral-100 shadow-md transition duration-300 hover:-translate-y-1 hover:border-sky-300/60 hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-700/50"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={city.heroImage}
                alt=""
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={i < 3}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  {city.country}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight">{city.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-white/85">{city.tagline}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-200 transition group-hover:text-white">
                  Explore experiences
                  <span aria-hidden className="transition group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
