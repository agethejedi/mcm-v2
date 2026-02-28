// src/api.js

async function fetchJSON(path, { cache = "no-store", timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(path, { cache, signal: controller.signal });
    if (!r.ok) throw new Error(`${path} failed: ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Snapshot (prices + baseline + highs + reversal flags)
 */
export async function getSnapshot(symbols) {
  const u = new URL("/api/snapshot", window.location.origin);
  u.searchParams.set("symbols", symbols.join(","));
  return await fetchJSON(u.toString(), { cache: "no-store" });
}

/**
 * Coach latest
 * Normalizes the response so app.js can rely on:
 * { asof_local, asof_market, session, text: [] }
 */
export async function getCoachLatest() {
  try {
    const j = await fetchJSON("/api/coach/latest", { cache: "no-store" });
    if (!j) return null;

    // Your backend may return either:
    //  1) { coach: { ... } }
    //  2) { ... } directly
    const c = j.coach || j;
    if (!c) return null;

    return {
      asof_local: c.asof_local || null,
      asof_market: c.asof_market || null,
      session: c.session || null,
      text: Array.isArray(c.text) ? c.text : (c.text ? [String(c.text)] : [])
    };
  } catch {
    return null;
  }
}

/**
 * Events (library)
 */
export async function getActiveEvent() {
  try {
    return await fetchJSON("/api/events/active", { cache: "no-store" });
  } catch {
    return null;
  }
}

export async function getEventsIndex() {
  try {
    const j = await fetchJSON("/api/events/index", { cache: "no-store" });
    return Array.isArray(j) ? j : (j?.events || []);
  } catch {
    return [];
  }
}

/**
 * Fundamentals: Dividends
 * Requires backend endpoint:
 *   GET /api/fundamentals/dividends?symbol=MSFT
 */
export async function getDividends(symbol) {
  const sym = String(symbol || "").trim().toUpperCase();
  if (!sym) throw new Error("Missing symbol");
  const u = new URL("/api/fundamentals/dividends", window.location.origin);
  u.searchParams.set("symbol", sym);
  return await fetchJSON(u.toString(), { cache: "no-store" });
}

/**
 * Fundamentals: Earnings / EPS (last 4 quarters)
 * Requires backend endpoint:
 *   GET /api/fundamentals/earnings?symbol=MSFT
 */
export async function getEarnings(symbol) {
  const sym = String(symbol || "").trim().toUpperCase();
  if (!sym) throw new Error("Missing symbol");
  const u = new URL("/api/fundamentals/earnings", window.location.origin);
  u.searchParams.set("symbol", sym);
  return await fetchJSON(u.toString(), { cache: "no-store" });
}
