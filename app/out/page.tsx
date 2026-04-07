import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Opening booking link · Itinera",
  robots: {
    index: false,
    follow: false,
  },
};

type Search = {
  to?: string;
  provider?: string;
};

export default async function OutboundAffiliatePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const destination = normalizeDestination(sp.to);

  if (!destination) notFound();

  const provider = sp.provider?.trim() || "booking provider";

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Booking redirect
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-zinc-100">
        Opening {provider}
      </h1>
      <p className="text-sm leading-6 text-neutral-600 dark:text-zinc-400">
        This handoff page renders the booking link before you leave Itinera so Travelpayouts can
        process the click. If nothing happens automatically after a short pause, use the continue
        button below.
      </p>
      <a
        id="affiliate-target"
        href={destination}
        className="inline-flex w-fit items-center justify-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Continue to {provider}
      </a>
      <p className="text-xs text-neutral-500 dark:text-zinc-500">{destination}</p>
      <Script id="affiliate-redirect" strategy="afterInteractive">
        {`(function () {
            var opened = false;
            var startedAt = Date.now();
            var originalHref = ${JSON.stringify(destination)};
            function openCurrentLink() {
              if (opened) return false;
              var anchor = document.getElementById("affiliate-target");
              if (!anchor) return false;
              opened = true;
              window.location.assign(anchor.href);
              return true;
            }
            function shouldContinue() {
              var anchor = document.getElementById("affiliate-target");
              if (!anchor) return false;
              if (anchor.href !== originalHref) return true;
              return Date.now() - startedAt >= 6000;
            }
            function tick() {
              if (opened) return;
              if (shouldContinue()) {
                openCurrentLink();
                return;
              }
              window.setTimeout(tick, 250);
            }
            window.addEventListener("load", function () {
              window.setTimeout(tick, 500);
            }, { once: true });
            window.setTimeout(tick, 6500);
          })();`}
      </Script>
    </div>
  );
}

function normalizeDestination(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
