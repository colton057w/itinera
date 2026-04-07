export type TripVibe = {
  /** Tailwind gradient utility segment (after bg-gradient-to-br) */
  gradient: string;
  shortLabel: string;
};

const DEFAULT_VIBE: TripVibe = {
  gradient:
    "from-slate-500 via-teal-600 to-zinc-800 dark:from-slate-900 dark:via-teal-950 dark:to-zinc-950",
  shortLabel: "Journey",
};

type Rule = { test: RegExp; vibe: TripVibe };

const RULES: Rule[] = [
  {
    test: /\b(wedding|ceremony|bridal|rehearsal|reception|vow|elopement|honeymoon)\b/i,
    vibe: {
      gradient:
        "from-rose-300 via-fuchsia-200 to-amber-100 dark:from-rose-950 dark:via-fuchsia-950 dark:to-amber-950",
      shortLabel: "Celebration",
    },
  },
  {
    test: /\b(caribbean|bahamas|maldives|aruba|jamaica|cayman|bermuda|tulum|riviera maya|bvi|usvi|hawaii|oahu|maui|fiji|bali beach|seychelles)\b/i,
    vibe: {
      gradient:
        "from-sky-400 via-cyan-300 to-amber-200 dark:from-sky-950 dark:via-cyan-950 dark:to-amber-900",
      shortLabel: "Coastal",
    },
  },
  {
    test: /\b(beach|tropical|island hop|snorkel|reef)\b/i,
    vibe: {
      gradient:
        "from-cyan-400 via-teal-300 to-amber-100 dark:from-cyan-950 dark:via-teal-950 dark:to-amber-950",
      shortLabel: "Tropical",
    },
  },
  {
    test: /\b(hik(e|ing)|trek|trail|patagonia|dolomite|appalachian|yosemite|banff|glacier nat|national park|camping|backpack)\b/i,
    vibe: {
      gradient:
        "from-emerald-600 via-lime-700 to-amber-900 dark:from-emerald-950 dark:via-lime-950 dark:to-amber-950",
      shortLabel: "Trails",
    },
  },
  {
    test: /\b(ski|skiing|snowboard|chalet|aspen|verbier|whistler|niseko)\b/i,
    vibe: {
      gradient:
        "from-sky-300 via-slate-200 to-indigo-300 dark:from-sky-950 dark:via-slate-900 dark:to-indigo-950",
      shortLabel: "Alpine",
    },
  },
  {
    test: /\b(safari|serengeti|kruger|masai|kenya tanzania)\b/i,
    vibe: {
      gradient:
        "from-amber-500 via-orange-700 to-lime-900 dark:from-amber-950 dark:via-orange-950 dark:to-lime-950",
      shortLabel: "Safari",
    },
  },
  {
    test: /\b(desert|sahara|wadi|moab|sedona|death valley)\b/i,
    vibe: {
      gradient:
        "from-orange-400 via-rose-400 to-amber-900 dark:from-orange-950 dark:via-rose-950 dark:to-amber-950",
      shortLabel: "Desert",
    },
  },
  {
    test: /\b(paris|tokyo|rome|london|nyc|new york|barcelona|lisbon|prague|city break|urban)\b/i,
    vibe: {
      gradient:
        "from-violet-500 via-indigo-500 to-slate-700 dark:from-violet-950 dark:via-indigo-950 dark:to-slate-950",
      shortLabel: "City",
    },
  },
  {
    test: /\b(wine|napa|tuscany|bordeaux|vineyard|champagne region)\b/i,
    vibe: {
      gradient:
        "from-purple-400 via-rose-300 to-amber-200 dark:from-purple-950 dark:via-rose-950 dark:to-amber-950",
      shortLabel: "Wine country",
    },
  },
];

function haystack(title: string, summary: string | null, tags: string[]): string {
  return `${tags.join(" ")} ${title} ${summary ?? ""}`.toLowerCase();
}

export function resolveTripVibe(input: {
  title: string;
  summary: string | null;
  tags: string[];
}): TripVibe {
  const text = haystack(input.title, input.summary, input.tags);
  for (const { test, vibe } of RULES) {
    if (test.test(text)) return vibe;
  }
  return DEFAULT_VIBE;
}
