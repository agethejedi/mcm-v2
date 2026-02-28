// functions/api/fundamentals/earnings.js
import { json } from "../../_util.js";

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchTwelve(path, params, apiKey) {
  const u = new URL(`https://api.twelvedata.com/${path}`);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  u.searchParams.set("apikey", apiKey);

  const r = await fetch(u.toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j) throw new Error(`twelvedata_http_${r.status}`);
  if (j.status === "error") throw new Error(j.message || "Twelve Data error");
  return j;
}

export async function onRequestGet({ request, env }) {
  const apiKey = env.TWELVE_DATA_API_KEY || env.TWELVEDATA_API_KEY;
  if (!apiKey) return json({ error: "Missing TWELVE_DATA_API_KEY" }, 500);
  if (!env.MCM_KV) return json({ error: "Missing KV binding MCM_KV" }, 500);

  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();
  if (!symbol) return json({ error: "Missing ?symbol=" }, 400);

  const cacheKey = `mcm:fund:earnings:${symbol}`;
  const cached = await env.MCM_KV.get(cacheKey, "json");
  if (cached) return json(cached);

  // Twelve Data /earnings provides EPS estimate/actual and history. :contentReference[oaicite:2]{index=2}
  const raw = await fetchTwelve("earnings", { symbol }, apiKey);

  const rows = Array.isArray(raw?.earnings) ? raw.earnings : (Array.isArray(raw?.data) ? raw.data : []);
  const normalized = rows.map(e => ({
    date: e.date || e.report_date || e.datetime || null,
    period: e.period || e.fiscal_period || null,
    eps_estimate: toNum(e.eps_estimate ?? e.epsEstimate),
    eps_actual: toNum(e.eps_actual ?? e.epsActual),
    revenue_estimate: toNum(e.revenue_estimate ?? e.revenueEstimate),
    revenue_actual: toNum(e.revenue_actual ?? e.revenueActual)
  })).filter(x => x.date || x.period).slice(0, 12);

  const out = {
    symbol,
    asof_local: new Date().toLocaleString(),
    source: "twelvedata",
    earnings: normalized,
    last4: normalized.slice(0, 4)
  };

  // Cache 12h
  await env.MCM_KV.put(cacheKey, JSON.stringify(out), { expirationTtl: 12 * 60 * 60 });

  return json(out);
}
