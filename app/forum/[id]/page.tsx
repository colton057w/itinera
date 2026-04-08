import Link from "next/link";
import { notFound } from "next/navigation";
import { ForumThreadAdminBar } from "@/components/forum/ForumThreadAdminBar";
import { ForumReplyForm } from "@/components/forum/ForumReplyForm";
import { isUserAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id },
      select: { title: true },
    });
    if (!post) return { title: "Thread · Itinera" };
    return { title: `${post.title} · Forum · Itinera` };
  } catch {
    return { title: "Thread · Itinera" };
  }
}

export default async function ForumThreadPage({ params }: Props) {
  const { id } = await params;

  const post = await prisma.forumPost.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      author: { select: { name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      },
    },
  });

  if (!post) notFound();

  const session = await auth();
  const isAdmin =
    session?.user?.id != null ? await isUserAdmin(session.user.id) : false;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/forum"
        className="text-sm font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Forum
      </Link>

      {isAdmin ? (
        <div className="mt-6">
          <ForumThreadAdminBar
            postId={post.id}
            initialTitle={post.title}
            initialBody={post.body}
            replies={post.replies.map((r) => ({ id: r.id, body: r.body }))}
          />
        </div>
      ) : null}

      <article className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
          {post.title}
        </h1>
        <p className="mt-2 text-xs text-neutral-500 dark:text-zinc-500">
          {post.author.name ?? "Member"} · {post.createdAt.toLocaleString()}
        </p>
        <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-zinc-200">
          {post.body}
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-500">
          Replies ({post.replies.length})
        </h2>
        {post.replies.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600 dark:text-zinc-400">No replies yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {post.replies.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs text-neutral-500 dark:text-zinc-500">
                  {r.author.name ?? "Member"} · {r.createdAt.toLocaleString()}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800 dark:text-zinc-200">
                  {r.body}
                </p>
              </li>
            ))}
          </ul>
        )}

        <ForumReplyForm postId={post.id} />
      </section>
    </div>
  );
}
