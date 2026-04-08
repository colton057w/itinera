import Link from "next/link";
import { redirect } from "next/navigation";
import { isUserAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

export const metadata = {
  title: "Users (admin) · Itinera",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/users");
  }
  if (!(await isUserAdmin(session.user.id))) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          itineraries: true,
          comments: true,
          votes: true,
          starred: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
        Admin
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
        Users
      </h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-zinc-400">
        Open a member to see their full profile, itineraries, and starred trips.
      </p>

      <ul className="mt-8 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {users.map((u) => (
          <li key={u.id}>
            <Link
              href={`/admin/users/${u.id}`}
              className="flex flex-col gap-1 px-4 py-4 transition hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-800/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-900 dark:text-zinc-100">
                  {u.name ?? u.email?.split("@")[0] ?? "User"}
                  {u.role === "ADMIN" ? (
                    <span
                      className="ml-2 text-amber-600 dark:text-amber-400"
                      title="Admin"
                      aria-label="Admin"
                    >
                      👑
                    </span>
                  ) : null}
                </p>
                {u.email ? (
                  <p className="truncate text-sm text-neutral-500 dark:text-zinc-500">{u.email}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-zinc-500">
                <span>{u._count.itineraries} itineraries</span>
                <span>{u._count.starred} starred</span>
                <span>{u._count.comments} comments</span>
                <span className="capitalize">{u.role.toLowerCase()}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {users.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-600 dark:text-zinc-400">No users yet.</p>
      ) : null}
    </div>
  );
}
