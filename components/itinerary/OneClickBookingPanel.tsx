import type { OneClickBookingModel } from "@/lib/booking-links";

export function OneClickBookingPanel({
  booking,
}: {
  booking: OneClickBookingModel | null;
}) {
  if (!booking) return null;

  return (
    <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-emerald-950 dark:text-emerald-100">
          One-click booking
        </h2>
        {booking.dateRangeLabel ? (
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-emerald-900 dark:bg-zinc-900/80 dark:text-emerald-200">
            {booking.dateRangeLabel}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-emerald-900/90 dark:text-emerald-100/90">
        {booking.summary}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {booking.stackLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm text-emerald-950 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-700/80 dark:bg-zinc-900 dark:text-emerald-100 dark:hover:bg-emerald-900/40"
          >
            <span className="block font-semibold">{link.label}</span>
            <span className="mt-0.5 block text-xs font-normal text-emerald-800/90 dark:text-emerald-200/90">
              {link.note}
            </span>
          </a>
        ))}
      </div>

      {booking.quickLinks.length ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {booking.quickLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-800 underline decoration-emerald-600/30 underline-offset-2 hover:decoration-emerald-700 dark:text-emerald-300"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}
