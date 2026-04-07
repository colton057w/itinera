"use client";

type Props = {
  value: number | null;
  onChange?: (stars: number | null) => void;
  readOnly?: boolean;
  label?: string;
};

export function StarRating({ value, onChange, readOnly, label = "Your rating" }: Props) {
  const interactive = Boolean(onChange) && !readOnly;

  return (
    <div className="space-y-1">
      <span className="text-xs text-neutral-500 dark:text-zinc-400">{label}</span>
      <div className="flex flex-wrap items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = value != null && n <= value;
          if (!interactive) {
            return (
              <span
                key={n}
                className="p-0.5 text-2xl leading-none text-amber-400"
                aria-hidden
              >
                {filled ? "★" : "☆"}
              </span>
            );
          }
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={filled}
              onClick={() => {
                onChange!(value === n ? null : n);
              }}
              className="rounded p-0.5 text-2xl leading-none text-amber-400 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {filled ? "★" : "☆"}
            </button>
          );
        })}
        {interactive && value != null ? (
          <button
            type="button"
            onClick={() => onChange!(null)}
            className="ml-1 text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
