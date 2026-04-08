"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

export function ForumNewThreadForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (status === "loading") {
    return <p className="text-sm text-neutral-500 dark:text-zinc-500">Loading…</p>;
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/80 px-5 py-6 dark:border-zinc-600 dark:bg-zinc-900/60">
        <p className="text-sm text-neutral-700 dark:text-zinc-300">
          <Link href="/login" className="font-semibold text-emerald-700 underline dark:text-emerald-400">
            Log in
          </Link>{" "}
          or{" "}
          <Link href="/register" className="font-semibold text-emerald-700 underline dark:text-emerald-400">
            sign up
          </Link>{" "}
          to start a thread.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not post");
      setTitle("");
      setBody("");
      router.push(`/forum/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-500">
        New thread
      </p>
      {error ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <label className="mt-3 block">
        <span className="sr-only">Title</span>
        <input
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base font-semibold text-neutral-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </label>
      <label className="mt-3 block">
        <span className="sr-only">Body</span>
        <textarea
          required
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What’s on your mind? Tips, trip questions, gear, destinations…"
          className="w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {saving ? "Posting…" : "Post thread"}
      </button>
    </form>
  );
}
