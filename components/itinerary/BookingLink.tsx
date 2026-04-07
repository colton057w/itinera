import type { BookingLinkResult } from "@/lib/booking-links";

const providerColors: Record<string, { bg: string; text: string; hover: string; ring: string }> = {
  Aviasales: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-800 dark:text-sky-200",
    hover: "hover:bg-sky-100 dark:hover:bg-sky-950/60",
    ring: "ring-sky-200 dark:ring-sky-800",
  },
  Hotellook: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-800 dark:text-violet-200",
    hover: "hover:bg-violet-100 dark:hover:bg-violet-950/60",
    ring: "ring-violet-200 dark:ring-violet-800",
  },
  OpenTable: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-800 dark:text-rose-200",
    hover: "hover:bg-rose-100 dark:hover:bg-rose-950/60",
    ring: "ring-rose-200 dark:ring-rose-800",
  },
  GetYourGuide: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-800 dark:text-orange-200",
    hover: "hover:bg-orange-100 dark:hover:bg-orange-950/60",
    ring: "ring-orange-200 dark:ring-orange-800",
  },
};

const defaultColors = {
  bg: "bg-emerald-50 dark:bg-emerald-950/40",
  text: "text-emerald-800 dark:text-emerald-200",
  hover: "hover:bg-emerald-100 dark:hover:bg-emerald-950/60",
  ring: "ring-emerald-200 dark:ring-emerald-800",
};

const providerIcons: Record<string, string> = {
  Aviasales: "✈",
  Hotellook: "🏨",
  OpenTable: "🍽",
  GetYourGuide: "🎯",
};

export function BookingLink({ link }: { link: BookingLinkResult }) {
  const c = providerColors[link.provider] ?? defaultColors;
  const icon = providerIcons[link.provider] ?? "🔗";

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${c.bg} ${c.text} ${c.hover} ${c.ring}`}
    >
      <span aria-hidden>{icon}</span>
      {link.label}
      <span className="text-[10px] opacity-60">via {link.provider}</span>
    </a>
  );
}
