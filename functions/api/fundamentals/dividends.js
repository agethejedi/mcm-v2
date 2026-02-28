// functions/api/fundamentals/dividends.js
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

  const cacheKey = `mcm:fund:dividends:${symbol}`;
  const cached = await env.MCM_KV.get(cacheKey, "json");
  if (cached) return json(cached);

  // Twelve Data "dividends" returns dividend history (10+ years per docs/exchange page). :contentReference[oaicite:1]{index=1}
  const raw = await fetchTwelve("dividends", { symbol }, apiKey);

  // Normalize to what the UI wants
  const items = Array.isArray(raw?.dividends) ? raw.dividends : (Array.isArray(raw?.data) ? raw.data : []);
  const normalized = items
    .map(d => ({
      ex_date: d.ex_date || d.exDate || d.date || null,
      pay_date: d.pay_date || d.payment_date || d.payDate || null,
      record_date: d.record_date || d.recordDate || null,
      declaration_date: d.declaration_date || d.declarationDate || null,
      amount: toNum(d.amount ?? d.dividend ?? d.value)
    }))
    .filter(x => x.ex_date || x.pay_date || x.amount !== null)
    .slice(0, 50);

  const out = {
    symbol,
    asof_local: new Date().toLocaleString(),
    source: "twelvedata",
    dividends: normalized
  };

  // Cache for 12h (tune as you like)
  await env.MCM_KV.put(cacheKey, JSON.stringify(out), { expirationTtl: 12 * 60 * 60 });

  return json(out);
}
