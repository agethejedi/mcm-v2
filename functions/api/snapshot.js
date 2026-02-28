import { json, getNowInTZ, cadenceSeconds, roundDownToCadence, isRTH, formatLocal } from "../_util.js";

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchQuote(symbol, apiKey) {
  const u = new URL("https://api.twelvedata.com/quote");
  u.searchParams.set("symbol", symbol);
  u.searchParams.set("apikey", apiKey);
  const r = await fetch(u.toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
  const j = await r.json();
  if (j?.status === "error") throw new Error(j.message || "Twelve Data error");
  return j;
}

async function fetchSeries(symbol, apiKey, interval = "5min", outputsize = "200") {
  const u = new URL("https://api.twelvedata.com/time_series");
  u.searchParams.set("symbol", symbol);
  u.searchParams.set("interval", interval);
  u.searchParams.set("outputsize", outputsize);
  u.searchParams.set("apikey", apiKey);
  const r = await fetch(u.toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
  const j = await r.json();
  if (j?.status === "error") throw new Error(j.message || "Twelve Data error");
  return j;
}

async function fetchLatestDailyClose(symbol, apiKey) {
  const u = new URL("https://api.twelvedata.com/time_series");
  u.searchParams.set("symbol", symbol);
  u.searchParams.set("interval", "1day");
  u.searchParams.set("outputsize", "1");
  u.searchParams.set("apikey", apiKey);
  const r = await fetch(u.toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
  const j = await r.json();
  if (j?.status === "error") throw new Error(j.message || "Twelve Data error");
  const bar = j.values?.[0];
  return bar ? toNum(bar.close) : null;
}

function mkReversal(baseline, sessionHigh, last, threshold) {
  if (!Number.isFinite(baseline) || baseline <= 0) {
    return { threshold, needHigh: null, confirmed: false, detail: "Missing baseline." };
  }
  const needHigh = baseline * (1 + threshold);
  const confirmed =
    Number.isFinite(sessionHigh) &&
    Number.isFinite(last) &&
    sessionHigh >= needHigh &&
    last > baseline;

  return {
    threshold,
    needHigh,
    confirmed,
    detail: `Need High ≥ $${needHigh.toFixed(2)} and Last > $${baseline.toFixed(2)} (threshold ${(threshold * 100).toFixed(2)}%).`
  };
}

function computeHighAndLastFromSeries(values) {
  if (!Array.isArray(values) || !values.length) return { high: null, last: null };

  // TwelveData returns newest first typically
  const last = toNum(values[0]?.close);

  let high = null;
  for (const v of values) {
    const h = toNum(v?.high);
    if (h !== null) high = high === null ? h : Math.max(high, h);
  }
  return { high, last };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const symbols = (url.searchParams.get("symbols") || "")
    .split(",").map(s => s.trim().toUpperCase()).filter(Boolean);

  if (!symbols.length) return json({ error: "Missing symbols param" }, 400);
  const apiKey = env.TWELVE_DATA_API_KEY || env.TWELVEDATA_API_KEY;
  if (!apiKey) return json({ error: "Missing TWELVE_DATA_API_KEY" }, 500);
  if (!env.MCM_KV) return json({ error: "Missing KV binding MCM_KV" }, 500);

  const nowET = getNowInTZ("America/New_York");
  const cadence = cadenceSeconds(nowET);
  const bucket = roundDownToCadence(nowET, cadence);
  const bucketKey = `${bucket.year}-${String(bucket.month).padStart(2,"0")}-${String(bucket.day).padStart(2,"0")}:${String(bucket.hour).padStart(2,"0")}:${String(bucket.minute).padStart(2,"0")}`;

  const thresholds = { MSFT:0.005, CRM:0.010, JPM:0.008, IBM:0.007, NKE:0.010, AXP:0.012 };

  const out = {};

  for (const sym of symbols) {
    const cacheKey = `snap:${sym}:${bucketKey}`;
    const cached = await env.MCM_KV.get(cacheKey, "json");

    if (cached) {
      out[sym] = cached;
      continue;
    }

    try {
      // 1) Baseline (Day-0 close) persisted in KV
      const baseKey = `baseline:${sym}`;
      let baseline = toNum(await env.MCM_KV.get(baseKey));
      if (baseline === null) {
        const close = await fetchLatestDailyClose(sym, apiKey);
        if (close !== null) {
          baseline = close;
          await env.MCM_KV.put(baseKey, String(close));
        }
      }

      // 2) Quote + 5min series fallback
      const [q, series] = await Promise.all([
        fetchQuote(sym, apiKey),
        fetchSeries(sym, apiKey, "5min", "200")
      ]);

      // Pull last from quote using multiple possible fields
      const lastFromQuote =
        toNum(q?.price) ??
        toNum(q?.close) ??
        toNum(q?.last) ??
        toNum(q?.open) ??
        null;

      // Pull previous close if present (useful for performance page later)
      const prevClose =
        toNum(q?.previous_close) ??
        toNum(q?.prev_close) ??
        null;

      // Series-derived last/high (more reliable)
      const values = Array.isArray(series?.values) ? series.values : [];
      const seriesStats = computeHighAndLastFromSeries(values);

      const last = lastFromQuote ?? seriesStats.last ?? prevClose ?? baseline ?? null;

      // For now, use series high as the “session high” proxy
      const rthHigh = seriesStats.high ?? toNum(q?.high) ?? null;
      const ethHigh = rthHigh; // v1/v2 parity for now

      const thr = thresholds[sym] ?? 0.01;

      const payload = {
        symbol: sym,
        baseline,
        last,
        meta: { previous_close: prevClose },
        rth: {
          high: rthHigh,
          perfHigh: (Number.isFinite(rthHigh) && Number.isFinite(baseline) && baseline) ? (rthHigh - baseline) / baseline : null,
          reversal: mkReversal(baseline, rthHigh, last, thr)
        },
        eth: {
          available: true,
          high: ethHigh,
          perfHigh: (Number.isFinite(ethHigh) && Number.isFinite(baseline) && baseline) ? (ethHigh - baseline) / baseline : null,
          reversal: mkReversal(baseline, ethHigh, last, thr)
        },
        asof_market: q?.datetime || q?.timestamp || null,
        asof_local: formatLocal("America/Chicago"),
      };

      out[sym] = payload;

      await env.MCM_KV.put(cacheKey, JSON.stringify(payload), {
        expirationTtl: Math.max(cadence + 30, 330)
      });

    } catch (e) {
      out[sym] = { symbol: sym, error: String(e) };
    }
  }

  out._meta = {
    asof_market: `${nowET.year}-${String(nowET.month).padStart(2,"0")}-${String(nowET.day).padStart(2,"0")} ${String(nowET.hour).padStart(2,"0")}:${String(nowET.minute).padStart(2,"0")} ET`,
    asof_local: formatLocal("America/Chicago"),
    in_rth: isRTH(nowET),
    cadence_rth: "5m",
    cadence_eth: "1h",
    bucket: bucketKey,
    note: "Backend enforces credits-aware cadence (RTH 5m, ETH 1h) via KV caching."
  };

  return json(out);
}
