"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Reply = { id: string; body: string };

export function ForumThreadAdminBar({
  postId,
  initialTitle,
  initialBody,
  replies,
}: {
  postId: string;
  initialTitle: string;
  initialBody: string;
  replies: Reply[];
}) {
  const router = useRouter();
  const [editingThread, setEditingThread] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [replyEdits, setReplyEdits] = useState<Record<string, string>>(
    () => Object.fromEntries(replies.map((r) => [r.id, r.body])),
  );

  async function saveThread() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setEditingThread(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteThread() {
    if (!window.confirm("Delete this thread and all replies? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/forum/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/forum");
      router.refresh();
    } catch {
      setErr("Could not delete thread.");
      setBusy(false);
    }
  }

  async function saveReply(replyId: string) {
    const text = replyEdits[replyId]?.trim() ?? "";
    if (!text) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/forum/replies/${replyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteReply(replyId: string) {
    if (!window.confirm("Delete this reply?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/forum/replies/${replyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.refresh();
    } catch {
      setErr("Could not delete reply.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
          <span aria-hidden>👑</span> Admin moderation
        </p>
        <Link
          href="/admin/users"
          className="text-xs font-medium text-amber-800 underline dark:text-amber-300"
        >
          User directory
        </Link>
      </div>
      {err ? (
        <p className="mt-2 text-sm text-red-700 dark:text-red-400" role="alert">
          {err}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => setEditingThread((e) => !e)}
          className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 disabled:opacity-50 dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-100"
        >
          {editingThread ? "Cancel edit" : "Edit thread"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void deleteThread()}
          className="rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 disabled:opacity-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-300"
        >
          Delete thread
        </button>
      </div>

      {editingThread ? (
        <div className="mt-4 space-y-2 border-t border-amber-200/80 pt-4 dark:border-amber-900/50">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm dark:border-amber-900 dark:bg-zinc-950"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm dark:border-amber-900 dark:bg-zinc-950"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveThread()}
            className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
          >
            Save thread
          </button>
        </div>
      ) : null}

      {replies.length > 0 ? (
        <div className="mt-4 border-t border-amber-200/80 pt-4 dark:border-amber-900/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
            Replies
          </p>
          <ul className="mt-2 space-y-3">
            {replies.map((r) => (
              <li key={r.id} className="rounded-lg border border-amber-200/80 bg-white/80 p-2 dark:border-amber-900/40 dark:bg-zinc-950/60">
                <textarea
                  value={replyEdits[r.id] ?? ""}
                  onChange={(e) =>
                    setReplyEdits((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                />
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveReply(r.id)}
                    className="text-xs font-medium text-amber-800 underline dark:text-amber-300"
                  >
                    Save reply
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteReply(r.id)}
                    className="text-xs font-medium text-red-700 underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
