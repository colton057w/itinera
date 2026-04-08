import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; role: "MEMBER" | "ADMIN" };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    picture?: string;
  }
}
