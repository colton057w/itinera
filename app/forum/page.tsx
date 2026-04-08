import Link from "next/link";
import { ForumNewThreadForm } from "@/components/forum/ForumNewThreadForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Forum · Itinera",
  description: "Community discussion for travelers and itinerary planners.",
};

type ForumListItem = {
  id: string;
  title: string;
  createdAt: Date;
  author: { name: string | null };
  _count: { replies: number };
};

export default async function ForumPage() {
  let posts: ForumListItem[] = [];
  try {
    posts = await prisma.forumPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { name: true } },
        _count: { select: { replies: true } },
      },
    });
  } catch {
    /* DB unavailable — empty list */
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Community
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">
          Forum
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-zinc-400">
          Ask questions, share tips, and chat like a subreddit—one list of threads, newest first.
        </p>
      </div>

      <div className="mb-10">
        <ForumNewThreadForm />
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-500">
        Threads
      </h2>
      {posts.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-10 text-center text-sm text-neutral-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
          No threads yet. Be the first to post.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/forum/${p.id}`}
                className="block px-5 py-4 transition hover:bg-neutral-50 dark:hover:bg-zinc-800/80"
              >
                <p className="font-medium text-neutral-900 dark:text-zinc-100">{p.title}</p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-zinc-500">
                  {p.author.name ?? "Member"} · {p.createdAt.toLocaleDateString()} ·{" "}
                  {p._count.replies} {p._count.replies === 1 ? "reply" : "replies"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
