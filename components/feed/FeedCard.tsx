"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { VoteControl } from "@/components/feed/VoteControl";
import { TripCoverVisual } from "@/components/feed/TripCoverVisual";
import { ItineraryStarButton } from "@/components/itinerary/ItineraryStarButton";

function PolaroidFan({ urls }: { urls: string[] }) {
  const u = urls.filter(Boolean).slice(0, 3);
  if (u.length === 0) return null;

  return (
    <motion.div
      className="relative h-[7.25rem] w-[6.75rem] shrink-0 touch-manipulation"
      initial="rest"
      whileHover="hover"
      variants={{
        rest: {},
        hover: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
      }}
    >
      {u.map((url, i) => (
        <motion.div
          key={`${url}-${i}`}
          variants={{
            rest: {
              rotate: -8 + i * 8,
              x: -8 + i * 8,
              y: i * 3,
              scale: 1,
              zIndex: i,
            },
            hover: {
              rotate: -20 + i * 20,
              x: -18 + i * 26,
              y: -12,
              scale: 1.05,
              zIndex: i === 1 ? 4 : i === 0 ? 3 : 2,
            },
          }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className="absolute bottom-0 left-1/2 -ml-[2.25rem] h-[5.75rem] w-[4.5rem] overflow-hidden rounded-[2px] border-[5px] border-white bg-white shadow-[0_10px_28px_rgba(0,0,0,0.16)] dark:border-zinc-100 dark:shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
        >
          <Image src={url} alt="" fill sizes="72px" className="object-cover" />
        </motion.div>
      ))}
    </motion.div>
  );
}

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
  previewUrls: string[];
}) {
  const stackUrls =
    props.previewUrls.length > 0
      ? props.previewUrls
      : props.coverImageUrl
        ? [props.coverImageUrl]
        : [];

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
          {stackUrls.length > 0 ? (
            <PolaroidFan urls={stackUrls} />
          ) : (
            <TripCoverVisual
              variant="feed"
              coverImageUrl={props.coverImageUrl}
              title={props.title}
              summary={props.summary}
              tags={props.tags}
            />
          )}
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
