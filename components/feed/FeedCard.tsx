import Image from "next/image";
import Link from "next/link";
import { VoteControl } from "@/components/feed/VoteControl";
import { ItineraryStarButton } from "@/components/itinerary/ItineraryStarButton";

export function FeedCard(props: {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  voteScore: number;
  dayCount: number;
  tags: string[];
  ownerName: string | null;
  myVote: number;
  myStarred: boolean;
}) {
  return (
    <article className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <VoteControl
        itineraryId={props.id}
        initialScore={props.voteScore}
        initialMyVote={props.myVote}
      />
      <div className="flex shrink-0 flex-col justify-start pt-0.5">
        <ItineraryStarButton itineraryId={props.id} initialStarred={props.myStarred} />
      </div>
      <Link href={`/itineraries/${props.slug}`} className="min-w-0 flex-1">
        <div className="flex gap-3">
          <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-zinc-800">
            {props.coverImageUrl ? (
              <Image
                src={props.coverImageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-neutral-400 dark:text-zinc-500">
                No photo
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-neutral-900 hover:underline dark:text-zinc-100">
              {props.title}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-zinc-400">
              {props.dayCount} days · {props.ownerName ?? "Planner"}
            </p>
            {props.summary ? (
              <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-zinc-400">
                {props.summary}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-1">
              {props.tags.slice(0, 6).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
