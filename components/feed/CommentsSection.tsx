"use client";

import type { CommentNode } from "@/types/comment";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

function CommentBlock({
  node,
  itineraryId,
  depth,
}: {
  node: CommentNode;
  itineraryId: string;
  depth: number;
}) {
  const router = useRouter();
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");

  async function postReply(parentId: string) {
    const text = reply.trim();
    if (!text || status !== "authenticated") return;
    const res = await fetch(`/api/itineraries/${itineraryId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text, parentId }),
    });
    if (!res.ok) return;
    setReply("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div
      className={
        depth > 0 ? "ml-6 border-l-2 border-neutral-200 pl-4 dark:border-zinc-700" : ""
      }
    >
      <div className="rounded-lg bg-neutral-50 px-3 py-2 dark:bg-zinc-800/60">
        <p className="text-xs font-medium text-neutral-600 dark:text-zinc-400">
          {node.author.name || "Member"}
        </p>
        <p className="mt-1 text-sm text-neutral-800 dark:text-zinc-200">{node.body}</p>
        {status === "authenticated" && depth < 6 ? (
          <button
            type="button"
            className="mt-2 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            onClick={() => setOpen((o) => !o)}
          >
            Reply
          </button>
        ) : null}
        {open ? (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              className="min-h-[60px] w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply…"
            />
            <button
              type="button"
              className="self-start rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              onClick={() => void postReply(node.id)}
            >
              Post reply
            </button>
          </div>
        ) : null}
      </div>
      <ul className="mt-3 space-y-3">
        {node.replies.map((r) => (
          <li key={r.id}>
            <CommentBlock node={r} itineraryId={itineraryId} depth={depth + 1} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CommentsSection({
  itineraryId,
  initialComments,
}: {
  itineraryId: string;
  initialComments: CommentNode[];
}) {
  const router = useRouter();
  const { status } = useSession();
  const [body, setBody] = useState("");

  async function postTop() {
    const text = body.trim();
    if (!text || status !== "authenticated") return;
    const res = await fetch(`/api/itineraries/${itineraryId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (!res.ok) return;
    setBody("");
    router.refresh();
  }

  return (
    <section className="mt-10 space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-zinc-100">Comments</h2>
      {status === "authenticated" ? (
        <div className="space-y-2">
          <textarea
            className="min-h-[80px] w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share tips or ask about this itinerary…"
          />
          <button
            type="button"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            onClick={() => void postTop()}
          >
            Comment
          </button>
        </div>
      ) : (
        <p className="text-sm text-neutral-600 dark:text-zinc-400">
          Log in to join the conversation.
        </p>
      )}
      <ul className="space-y-4">
        {initialComments.map((c) => (
          <li key={c.id}>
            <CommentBlock node={c} itineraryId={itineraryId} depth={0} />
          </li>
        ))}
      </ul>
    </section>
  );
}
