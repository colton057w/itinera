import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { promoteAdminByEmailList } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        if (user.email) {
          await promoteAdminByEmailList(user.email);
        }
      }
      if (user?.image) token.picture = user.image;
      if (trigger === "update" && session?.image && typeof session.image === "string") {
        token.picture = session.image;
      }
      return token;
    },
    async session({ session, token, trigger, newSession }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        const u = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        session.user.role = u?.role === "ADMIN" ? "ADMIN" : "MEMBER";
      }
      if (session.user && token.picture) {
        session.user.image = token.picture as string;
      }
      if (trigger === "update" && newSession?.image && typeof newSession.image === "string") {
        session.user.image = newSession.image;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
