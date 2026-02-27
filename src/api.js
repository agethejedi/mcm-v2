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
