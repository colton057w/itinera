"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function ProfileAvatarUpload({
  currentImageUrl,
  initialLetter,
}: {
  currentImageUrl: string | null;
  initialLetter: string;
}) {
  const { update } = useSession();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl);

  useEffect(() => {
    setPreview(currentImageUrl);
  }, [currentImageUrl]);

  const onPick = useCallback(() => {
    setError(null);
    inputRef.current?.click();
  }, []);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file || !file.type.startsWith("image/")) return;
      setLoading(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) {
          const j = (await up.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? "Upload failed");
          return;
        }
        const { url } = (await up.json()) as { url?: string };
        if (!url) {
          setError("No image URL returned");
          return;
        }
        const save = await fetch("/api/profile/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!save.ok) {
          const j = (await save.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? "Could not save profile photo");
          return;
        }
        setPreview(url);
        await update({ image: url });
        router.refresh();
      } finally {
        setLoading(false);
      }
    },
    [router, update],
  );

  return (
    <div className="relative shrink-0">
      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-neutral-200 text-2xl font-semibold text-neutral-600 shadow-md dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-200">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          initialLetter
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = "";
          void onFile(f);
        }}
      />
      <button
        type="button"
        disabled={loading}
        onClick={onPick}
        className="absolute -bottom-1 -right-1 rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        {loading ? "…" : "Photo"}
      </button>
      {error ? (
        <p className="absolute left-0 top-full z-10 mt-1 max-w-[12rem] text-[10px] text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
