"use client";

import type { CommentNode } from "@/types/comment";
import { sortCommentTree } from "@/lib/commentSort";
import { formatCommentAge } from "@/lib/commentTime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";

export type DayRef = { dayIndex: number; label: string };

function dayLabelMap(days: DayRef[]) {
  return new Map(days.map((d) => [d.dayIndex, d.label]));
}

function MentionPicker({
  days,
  selected,
  onToggle,
  disabled,
}: {
  days: DayRef[];
  selected: number[];
  onToggle: (dayIndex: number) => void;
  disabled?: boolean;
}) {
  if (days.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-neutral-500 dark:text-zinc-500">Mention</span>
      {days.map((d) => {
        const on = selected.includes(d.dayIndex);
        return (
          <button
            key={d.dayIndex}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(d.dayIndex)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              on
                ? "bg-emerald-600 text-white dark:bg-emerald-500"
                : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500"
            } disabled:opacity-50`}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

function VoteColumn({
  score,
  myVote,
  disabled,
  onVote,
}: {
  score: number;
  myVote: -1 | 0 | 1;
  disabled: boolean;
  onVote: (dir: "up" | "down") => void;
}) {
  return (
    <div className="flex w-9 shrink-0 flex-col items-center gap-0.5 border-r border-neutral-100 pr-2 dark:border-zinc-800">
      <button
        type="button"
        disabled={disabled}
        title={disabled ? "Log in to vote" : "Upvote"}
        onClick={() => onVote("up")}
        className={`rounded p-0.5 transition-colors ${
          myVote === 1
            ? "text-orange-600 dark:text-orange-400"
            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        } ${disabled ? "cursor-not-allowed opacity-35" : ""}`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 4l8 8h-5v8h-6v-8H4l8-8z" />
        </svg>
      </button>
      <span className="min-w-[1.25rem] text-center text-[11px] font-semibold tabular-nums text-neutral-600 dark:text-zinc-400">
        {score}
      </span>
      <button
        type="button"
        disabled={disabled}
        title={disabled ? "Log in to vote" : "Downvote"}
        onClick={() => onVote("down")}
        className={`rounded p-0.5 transition-colors ${
          myVote === -1
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        } ${disabled ? "cursor-not-allowed opacity-35" : ""}`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 20l-8-8h5V4h6v8h5l-8 8z" />
        </svg>
      </button>
    </div>
  );
}

function CommentThread({
  node,
  itineraryId,
  days,
  labels,
  depth,
}: {
  node: CommentNode;
  itineraryId: string;
  days: DayRef[];
  labels: Map<number, string>;
  depth: number;
}) {
  const router = useRouter();
  const { status } = useSession();
  const authed = status === "authenticated";
  const [openReply, setOpenReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyMentions, setReplyMentions] = useState<number[]>([]);
  const [posting, setPosting] = useState(false);
  const [voting, setVoting] = useState(false);

  function toggleReplyMention(idx: number) {
    setReplyMentions((prev) =>
      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx].sort((a, b) => a - b),
    );
  }

  async function postVote(dir: "up" | "down") {
    if (!authed || voting) return;
    setVoting(true);
    try {
      const res = await fetch(
        `/api/itineraries/${itineraryId}/comments/${node.id}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dir }),
        },
      );
      if (res.ok) router.refresh();
    } finally {
      setVoting(false);
    }
  }

  async function postReply(parentId: string) {
    const text = replyText.trim();
    if (!text || !authed || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: text,
          parentId,
          mentionedDayIndices: replyMentions,
        }),
      });
      if (!res.ok) return;
      setReplyText("");
      setReplyMentions([]);
      setOpenReply(false);
      router.refresh();
    } finally {
      setPosting(false);
    }
  }

  const initial = (node.author.name || "?").trim().slice(0, 1).toUpperCase();

  return (
    <div className={depth > 0 ? "mt-3 border-l border-neutral-200 pl-4 dark:border-zinc-700" : ""}>
      <div className="flex gap-2">
        <VoteColumn
          score={node.voteScore}
          myVote={node.myVote}
          disabled={!authed || voting}
          onVote={postVote}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <div className="flex items-center gap-2">
              {node.author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={node.author.image}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-zinc-600"
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-bold text-neutral-600 dark:bg-zinc-700 dark:text-zinc-200">
                  {initial}
                </div>
              )}
              <span className="text-sm font-medium text-neutral-900 dark:text-zinc-100">
                {node.author.name || "Member"}
              </span>
            </div>
            <span className="text-xs text-neutral-400 dark:text-zinc-500">
              · {formatCommentAge(node.createdAt)}
            </span>
          </div>

          {node.mentionedDayIndices.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {node.mentionedDayIndices.map((idx) => (
                <Link
                  key={idx}
                  href={`#itinerary-day-${idx}`}
                  className="inline-flex rounded-md border border-emerald-200/80 bg-emerald-50/90 px-1.5 py-0.5 text-[11px] font-medium text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
                >
                  {labels.get(idx) ?? `Day ${idx + 1}`}
                </Link>
              ))}
            </div>
          ) : null}

          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-snug text-neutral-800 dark:text-zinc-200">
            {node.body}
          </p>

          {authed && depth < 8 ? (
            <button
              type="button"
              className="mt-2 text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:text-zinc-500 dark:hover:text-zinc-300"
              onClick={() => setOpenReply((o) => !o)}
            >
              {openReply ? "Cancel" : "Reply"}
            </button>
          ) : null}

          {openReply ? (
            <div className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
              <MentionPicker
                days={days}
                selected={replyMentions}
                onToggle={toggleReplyMention}
                disabled={posting}
              />
              <textarea
                className="min-h-[72px] w-full resize-y rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                disabled={posting}
              />
              <button
                type="button"
                disabled={posting}
                className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                onClick={() => void postReply(node.id)}
              >
                {posting ? "Posting…" : "Post reply"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {node.replies.length > 0 ? (
        <ul className="mt-1 space-y-0">
          {node.replies.map((r) => (
            <li key={r.id}>
              <CommentThread
                node={r}
                itineraryId={itineraryId}
                days={days}
                labels={labels}
                depth={depth + 1}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function CommentsSection({
  itineraryId,
  initialComments,
  days = [],
}: {
  itineraryId: string;
  initialComments: CommentNode[];
  days?: DayRef[];
}) {
  const router = useRouter();
  const { status } = useSession();
  const authed = status === "authenticated";
  const [sortMode, setSortMode] = useState<"top" | "newest">("top");
  const [body, setBody] = useState("");
  const [mentions, setMentions] = useState<number[]>([]);
  const [posting, setPosting] = useState(false);

  const labels = useMemo(() => dayLabelMap(days), [days]);

  const sorted = useMemo(
    () => sortCommentTree(initialComments, sortMode),
    [initialComments, sortMode],
  );

  function toggleMention(idx: number) {
    setMentions((prev) =>
      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx].sort((a, b) => a - b),
    );
  }

  async function postTop() {
    const text = body.trim();
    if (!text || !authed || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: text,
          mentionedDayIndices: mentions,
        }),
      });
      if (!res.ok) return;
      setBody("");
      setMentions([]);
      router.refresh();
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="mt-14 border-t border-neutral-200 pt-10 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-zinc-100">
          Discussion
        </h2>
        <div
          className="inline-flex rounded-full border border-neutral-200 p-0.5 text-xs font-medium dark:border-zinc-700"
          role="group"
          aria-label="Sort comments"
        >
          <button
            type="button"
            onClick={() => setSortMode("top")}
            className={`rounded-full px-3 py-1 transition-colors ${
              sortMode === "top"
                ? "bg-neutral-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Top
          </button>
          <button
            type="button"
            onClick={() => setSortMode("newest")}
            className={`rounded-full px-3 py-1 transition-colors ${
              sortMode === "newest"
                ? "bg-neutral-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-neutral-600 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Newest
          </button>
        </div>
      </div>

      {authed ? (
        <div className="mt-6 space-y-2 rounded-xl border border-neutral-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <MentionPicker
            days={days}
            selected={mentions}
            onToggle={toggleMention}
            disabled={posting}
          />
          <textarea
            className="min-h-[100px] w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50/50 px-3 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-emerald-500"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ask a question, share a tip, or call out a day…"
            disabled={posting}
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={posting}
              onClick={() => void postTop()}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-neutral-600 dark:text-zinc-400">
          <Link href="/login" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            Log in
          </Link>{" "}
          to comment and vote.
        </p>
      )}

      <ul className="mt-8 divide-y divide-neutral-100 dark:divide-zinc-800/80">
        {sorted.length === 0 ? (
          <li className="py-8 text-center text-sm text-neutral-500 dark:text-zinc-500">
            No comments yet. Start the thread.
          </li>
        ) : (
          sorted.map((c) => (
            <li key={c.id} className="py-5 first:pt-0">
              <CommentThread
                node={c}
                itineraryId={itineraryId}
                days={days}
                labels={labels}
                depth={0}
              />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
