"use client";

type Props = {
  value: number | null;
  onChange?: (stars: number | null) => void;
  readOnly?: boolean;
  label?: string;
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2.5 15 9l7 .8-5.2 4.7 1.4 6.9L12 17.9 5.8 21.4l1.4-6.9L2 9.8 9 9l3-6.5z" />
    </svg>
  );
}

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
              <span key={n} className="p-0.5 text-amber-400" aria-hidden>
                <StarIcon filled={filled} />
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
              className="rounded p-0.5 text-amber-400 transition hover:scale-110"
            >
              <StarIcon filled={filled} />
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
