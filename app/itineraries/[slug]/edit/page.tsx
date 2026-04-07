import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StorybookBuilder } from "@/components/itinerary/storybook/StorybookBuilder";
import { itineraryDaysToDraft } from "@/lib/itineraryDbToDraft";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

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
  return { title: it ? `Edit · ${it.title}` : "Edit · Itinera" };
}

export default async function EditItineraryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/itineraries/${slug}/edit`)}`);
  }

  const it = await prisma.itinerary.findUnique({
    where: { slug },
    include: {
      tags: { include: { tag: true } },
      days: {
        orderBy: { dayIndex: "asc" },
        include: {
          events: { orderBy: { eventIndex: "asc" } },
        },
      },
    },
  });

  if (!it) notFound();
  if (it.ownerId !== session.user.id) notFound();

  const initialDays = itineraryDaysToDraft(it.days);
  const initialTagsInput = it.tags.map((t) => t.tag.name).join(", ");

  return (
    <div>
      <div className="border-b border-neutral-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <Link
          href={`/itineraries/${it.slug}`}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to trip
        </Link>
      </div>
      <StorybookBuilder
        mode="edit"
        itineraryId={it.id}
        returnSlug={it.slug}
        initialTitle={it.title}
        initialTagsInput={initialTagsInput}
        initialVisibility={it.visibility}
        initialTripKind={it.tripKind === "WEDDING_EVENT" ? "WEDDING_EVENT" : "VACATION"}
        initialDays={initialDays}
      />
    </div>
  );
}
