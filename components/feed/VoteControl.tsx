"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  itineraryId: string;
  initialScore: number;
  initialMyVote: number;
};

export function VoteControl({ itineraryId, initialScore, initialMyVote }: Props) {
  const { status } = useSession();
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [myVote, setMyVote] = useState(initialMyVote);

  async function send(value: number) {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    const res = await fetch(`/api/itineraries/${itineraryId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { voteScore: number; myVote: number };
    setScore(data.voteScore);
    setMyVote(data.myVote);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-50 px-1 py-1 dark:border-zinc-700 dark:bg-zinc-800/80">
      <button
        type="button"
        aria-label="Upvote"
        className={`rounded px-2 py-0.5 text-sm font-bold ${
          myVote === 1
            ? "text-orange-600 dark:text-orange-400"
            : "text-neutral-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400"
        }`}
        onClick={() => void send(myVote === 1 ? 0 : 1)}
      >
        ▲
      </button>
      <span className="text-xs font-semibold tabular-nums text-neutral-800 dark:text-zinc-200">
        {score}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        className={`rounded px-2 py-0.5 text-sm font-bold ${
          myVote === -1
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-neutral-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
        }`}
        onClick={() => void send(myVote === -1 ? 0 : -1)}
      >
        ▼
      </button>
    </div>
  );
}
