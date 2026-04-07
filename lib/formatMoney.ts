const ZERO = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);

export function formatMinorUnits(minor: number, currency = "USD"): string {
  const code = currency.trim().toUpperCase() || "USD";
  const digits = ZERO.has(code) ? 0 : 2;
  const major = minor / 10 ** digits;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(major);
  } catch {
    return `${(minor / 100).toFixed(2)} ${code}`;
  }
}

export function parseMoneyToMinor(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw).replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 9_999_999.99) return null;
  return Math.round(n * 100);
}
