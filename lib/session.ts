import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export function auth() {
  return getServerSession(authOptions);
}
