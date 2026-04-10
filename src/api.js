// src/api.js

export async function getSnapshot(symbols) {
  const u = new URL("/api/snapshot", window.location.origin);
  u.searchParams.set("symbols", symbols.join(","));
  const r = await fetch(u, { cache: "no-store" });
  if (!r.ok) throw new Error(`snapshot failed: ${r.status}`);
  return await r.json();
}

export async function getCoachLatest() {
  const r = await fetch("/api/coach/latest", { cache: "no-store" });
  if (!r.ok) return null;
  return await r.json();
}

export async function getActiveEvent() {
  try {
    const r = await fetch(`/api/events/active`, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function getEventsIndex() {
  try {
    const r = await fetch(`/api/events/index`, { cache: "no-store" });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j : (j?.events || []);
  } catch {
    return [];
  }
}

/**
 * Fundamentals (optional)
 * Expected endpoints:
 *  - /api/fundamentals/dividends?symbol=MSFT
 *  - /api/fundamentals/earnings?symbol=MSFT
 */
export async function getDividends(symbol) {
  try {
    const u = new URL("/api/fundamentals/dividends", window.location.origin);
    u.searchParams.set("symbol", String(symbol || "").toUpperCase());
    const r = await fetch(u, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function getEarnings(symbol) {
  try {
    const u = new URL("/api/fundamentals/earnings", window.location.origin);
    u.searchParams.set("symbol", String(symbol || "").toUpperCase());
    const r = await fetch(u, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}
// ============================================================
// ADD THESE TWO FUNCTIONS TO THE BOTTOM OF src/api.js
// ============================================================

/**
 * Fetch fundamentals from TwelveData via Cloudflare Function.
 * Returns P/E, EPS, Market Cap, 52-week high/low, Beta, Revenue, Yield.
 */
export async function getFundamentals(symbol) {
  const res = await fetch(`/api/fundamentals/stats?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Fundamentals fetch failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch AI-generated company blurb via Cloudflare Function.
 * Cached in KV — OpenAI is only called once per ticker ever.
 */
export async function getCompanyBlurb(symbol, name) {
  const params = new URLSearchParams({ symbol, name: name || symbol });
  const res = await fetch(`/api/company-blurb?${params}`);
  if (!res.ok) throw new Error(`Blurb fetch failed: ${res.status}`);
  return res.json();
}
