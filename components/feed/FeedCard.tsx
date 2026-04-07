"use client";

import Image from "next/image";
import Link from "next/link";
import { VoteControl } from "@/components/feed/VoteControl";
import { TripCoverVisual } from "@/components/feed/TripCoverVisual";
import { ItineraryStarButton } from "@/components/itinerary/ItineraryStarButton";

function scorePhotoQuality(url: string | null): number {
  if (!url) return 0;
  try {
    const parsed = new URL(url);
    const width = Number(parsed.searchParams.get("w") ?? "0");
    const quality = Number(parsed.searchParams.get("q") ?? "0");
    let score = parsed.hostname.includes("unsplash") ? 1 : 0;
    if (width >= 1200) score += 2;
    else if (width >= 900) score += 1;
    if (quality >= 85) score += 1;
    return score;
  } catch {
    return 1;
  }
}

function mediaHeightClass(hasPhoto: boolean, qualityScore: number, summary: string | null): string {
  const summaryLength = summary?.trim().length ?? 0;
  if (!hasPhoto) return "h-56 sm:h-60";
  if (qualityScore >= 3) return summaryLength > 115 ? "h-80 sm:h-96" : "h-72 sm:h-80";
  if (qualityScore >= 2) return summaryLength > 115 ? "h-72 sm:h-80" : "h-64 sm:h-72";
  return "h-60 sm:h-64";
}

function pickBestPhoto(coverImageUrl: string | null, previewUrls: string[]): string | null {
  const candidates = [coverImageUrl, ...previewUrls].filter(
    (url): url is string => typeof url === "string" && url.length > 0
  );
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => scorePhotoQuality(b) - scorePhotoQuality(a))[0] ?? null;
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
  const primaryImage = pickBestPhoto(props.coverImageUrl, props.previewUrls);
  const qualityScore = scorePhotoQuality(primaryImage);
  const mediaHeight = mediaHeightClass(Boolean(primaryImage), qualityScore, props.summary);

  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white/95 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/95 dark:hover:border-zinc-700">
      <Link href={`/itineraries/${props.slug}`} className="block">
        <div className={`relative overflow-hidden ${mediaHeight}`}>
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt=""
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.07]"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          ) : (
            <TripCoverVisual
              variant="feed"
              coverImageUrl={props.coverImageUrl}
              title={props.title}
              summary={props.summary}
              tags={props.tags}
              className="!h-full !w-full !rounded-none"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl border border-white/30 bg-white/16 p-3 text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)] backdrop-blur-md dark:border-white/20 dark:bg-zinc-900/40">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
              {props.dayCount} days · {props.ownerName ?? "Planner"}
            </p>
            <h2 className="mt-1 line-clamp-2 text-base font-semibold leading-tight">{props.title}</h2>
            {props.summary ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/85">{props.summary}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {props.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/35 bg-white/20 px-2 py-0.5 text-[10px] text-white/95"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-3 p-3">
        <VoteControl
          itineraryId={props.id}
          initialScore={props.voteScore}
          initialMyVote={props.myVote}
        />
        <div className="shrink-0">
          <ItineraryStarButton itineraryId={props.id} initialStarred={props.myStarred} />
        </div>
      </div>
    </article>
  );
}
