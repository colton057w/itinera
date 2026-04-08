import { prisma } from "@/lib/prisma";

/** Authoritative check for mutations (always hit the database). */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return u?.role === "ADMIN";
}

/**
 * Promote users whose email appears in ADMIN_EMAILS (comma-separated, case-insensitive).
 * Call after successful credential login.
 */
export async function promoteAdminByEmailList(email: string | null | undefined): Promise<void> {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw || !email) return;
  const normalized = email.trim().toLowerCase();
  const allowed = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  if (!allowed.has(normalized)) return;
  await prisma.user.updateMany({
    where: { email: normalized },
    data: { role: "ADMIN" },
  });
}
