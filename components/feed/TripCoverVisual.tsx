import Image from "next/image";
import { resolveTripVibe } from "@/lib/tripVibe";

type Variant = "feed" | "profile" | "hero";

const shell: Record<Variant, string> = {
  feed: "relative h-24 w-32 shrink-0 overflow-hidden rounded-lg",
  profile: "relative h-20 w-28 shrink-0 overflow-hidden rounded-lg",
  hero: "relative w-full overflow-hidden rounded-2xl",
};

export function TripCoverVisual({
  coverImageUrl,
  title,
  summary,
  tags,
  variant,
  priority,
  className,
}: {
  coverImageUrl: string | null;
  title: string;
  summary: string | null;
  tags: string[];
  variant: Variant;
  /** Next/Image priority for hero */
  priority?: boolean;
  className?: string;
}) {
  const vibe = resolveTripVibe({ title, summary, tags });
  const outer = (base: string) => [base, className].filter(Boolean).join(" ");

  if (coverImageUrl) {
    if (variant === "hero") {
      return (
        <div className={outer(`${shell.hero} aspect-[21/9] bg-neutral-100 dark:bg-zinc-800`)}>
          <Image
            src={coverImageUrl}
            alt=""
            fill
            className="object-cover"
            priority={priority}
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      );
    }
    return (
      <div className={outer(`${shell[variant]} bg-neutral-100 dark:bg-zinc-800`)}>
        <Image
          src={coverImageUrl}
          alt=""
          fill
          className="object-cover"
          sizes={variant === "profile" ? "112px" : "128px"}
        />
      </div>
    );
  }

  const grain = (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.9) 0%, transparent 42%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.35) 0%, transparent 38%)",
      }}
      aria-hidden
    />
  );

  if (variant === "hero") {
    return (
      <div className={outer(`${shell.hero} aspect-[21/9]`)}>
        <div className={`absolute inset-0 bg-gradient-to-br ${vibe.gradient}`} />
        {grain}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/85">
            {vibe.shortLabel}
          </p>
          <p className="mt-1 text-lg font-medium text-white drop-shadow-sm md:text-xl">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={outer(`${shell[variant]} bg-neutral-900`)}>
      <div className={`absolute inset-0 bg-gradient-to-br ${vibe.gradient}`} />
      {grain}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      <div className="relative flex h-full flex-col justify-end p-2">
        <span className="text-[9px] font-bold uppercase leading-tight tracking-[0.18em] text-white/90 drop-shadow-sm">
          {vibe.shortLabel}
        </span>
      </div>
    </div>
  );
}
