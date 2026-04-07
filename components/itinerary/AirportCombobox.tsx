"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filterAirports, type Airport } from "@/lib/airports";

type Props = {
  label: string;
  code: string;
  name: string;
  onChange: (airport: { code: string; name: string }) => void;
};

export function AirportCombobox({ label, code, name, onChange }: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const display = code && name ? `${code} — ${name}` : "";

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const suggestions = useMemo(() => filterAirports(query || code, 10), [query, code]);

  function pick(a: Airport) {
    onChange({ code: a.code, name: a.name });
    setQuery("");
    setOpen(false);
  }

  function clear() {
    onChange({ code: "", name: "" });
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative space-y-1">
      <span className="text-xs text-neutral-500 dark:text-zinc-400">{label}</span>
      <input
        type="text"
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        placeholder="Search code, city, or airport name…"
        value={open ? query : display}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onChange({ code: "", name: "" });
        }}
        onFocus={() => {
          setOpen(true);
          setQuery(code);
        }}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
      />
      {code ? (
        <button
          type="button"
          onClick={clear}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Clear airport
        </button>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-neutral-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {suggestions.map((a) => (
            <li key={a.code}>
              <button
                type="button"
                role="option"
                className="w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-zinc-800"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(a)}
              >
                <span className="font-mono font-semibold text-emerald-800 dark:text-emerald-400">
                  {a.code}
                </span>{" "}
                <span className="text-neutral-800 dark:text-zinc-200">{a.name}</span>
                <span className="block text-xs text-neutral-500 dark:text-zinc-500">{a.city}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
