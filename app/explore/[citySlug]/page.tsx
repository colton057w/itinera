import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddExperienceMenu } from "@/components/explore/AddExperienceMenu";
import { getCuratedCityBySlug, getCuratedCitySlugs } from "@/lib/curated-destinations";

type Props = { params: Promise<{ citySlug: string }> };

export async function generateStaticParams() {
  const slugs = await getCuratedCitySlugs();
  return slugs.map((citySlug) => ({ citySlug }));
}

export async function generateMetadata({ params }: Props) {
  const { citySlug } = await params;
  const city = await getCuratedCityBySlug(citySlug);
  if (!city) return { title: "City · Itinera" };
  return {
    title: `${city.name} experiences · Itinera`,
    description: `Curated experiences in ${city.name}, ${city.country}. Add stops to your Itinera story in one click.`,
  };
}

export default async function ExploreCityPage({ params }: Props) {
  const { citySlug } = await params;
  const city = await getCuratedCityBySlug(citySlug);
  if (!city) notFound();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950">
      <div className="relative h-[min(52vh,520px)] w-full overflow-hidden">
        <Image
          src={city.heroImage}
          alt=""
          priority
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-6 pb-10 pt-24 text-white">
          <Link
            href="/#top-cities"
            className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
          >
            ← All cities
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            {city.country}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{city.name}</h1>
          <p className="mt-3 max-w-xl text-lg text-white/90">{city.tagline}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-950 dark:text-white">
              Curated experiences
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-zinc-400">
              Add any card to a new story or queue several before you open the builder.
            </p>
          </div>
          <Link
            href="/itineraries/new"
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500"
          >
            Start blank story
          </Link>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {city.experiences.map((ex) => (
            <li
              key={ex.id}
              className="overflow-hidden rounded-[1.5rem] border border-neutral-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={ex.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-500">
                    {ex.locationLabel}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-neutral-950 dark:text-white">
                    {ex.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-zinc-400">
                    {ex.subtitle}
                  </p>
                </div>
                <div className="shrink-0">
                  <AddExperienceMenu experience={ex} cityName={city.name} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
