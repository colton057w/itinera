import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-6 py-20 text-center text-sm text-neutral-500">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
