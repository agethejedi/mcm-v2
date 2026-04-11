// functions/api/fundamentals/stats.js
//
// Data strategy:
//   TwelveData  — 52W High/Low, sector, industry, employees, website, description
//   FMP stable  — P/E, EPS, Market Cap, Beta, Revenue, Dividend Yield
//
// FMP base: https://financialmodelingprep.com/stable/
// Results cached in KV for 6 hours.
// Usage: GET /api/fundamentals/stats?symbol=AAPL

export async function onRequestGet(ctx) {
  const { searchParams } = new URL(ctx.request.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase().trim();

  if (!symbol) return json({ error: "symbol required" }, 400);

  const tdKey  = ctx.env.TWELVE_DATA_API_KEY;
  const fmpKey = ctx.env.FMP_API_KEY;

  if (!tdKey)  return json({ error: "TWELVE_DATA_API_KEY not configured" }, 500);
  if (!fmpKey) return json({ error: "FMP_API_KEY not configured" }, 500);

  // KV cache — 6 hours
  const cacheKey = `fundamentals:stats:v6:${symbol}`;
  try {
    const cached = await ctx.env.MCM_KV.get(cacheKey, "json");
    if (cached) return json({ ...cached, _cached: true });
  } catch {}

  // Fetch TwelveData and FMP in parallel
  const [td, fmp] = await Promise.all([
    fetchTwelveData(symbol, tdKey),
    fetchFMP(symbol, fmpKey),
  ]);

  const result = {
    symbol,

    // FMP fields
    pe:             fmp.pe             ?? null,
    eps:            fmp.eps            ?? null,
    market_cap:     fmp.market_cap     ?? null,
    beta:           fmp.beta           ?? null,
    revenue:        fmp.revenue        ?? null,
    dividend_yield: fmp.dividend_yield ?? null,

    // TwelveData fields
    week_52_high: td.week_52_high ?? null,
    week_52_low:  td.week_52_low  ?? null,
    sector:       td.sector       ?? fmp.sector   ?? null,
    industry:     td.industry     ?? fmp.industry ?? null,
    employees:    td.employees    ?? null,
    website:      td.website      ?? null,
    description:  td.description  ?? null,
  };

  // Cache 6 hours
  try {
    await ctx.env.MCM_KV.put(cacheKey, JSON.stringify(result), {
      expirationTtl: 21600,
    });
  } catch {}

  return json(result);
}

/* ============================================================
   TWELVEDATA — quote (52W range) + profile (description etc.)
   ============================================================ */

async function fetchTwelveData(symbol, apiKey) {
  const base = "https://api.twelvedata.com";
  const k    = `apikey=${apiKey}`;

  try {
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`${base}/quote?symbol=${symbol}&${k}`),
      fetch(`${base}/profile?symbol=${symbol}&${k}`),
    ]);

    const [quote, profile] = await Promise.all([
      quoteRes.json(),
      profileRes.json(),
    ]);

    const fw = quote?.fifty_two_week || {};

    return {
      week_52_high: safeNum(fw.high)            ?? null,
      week_52_low:  safeNum(fw.low)             ?? null,
      sector:       profile?.sector             || null,
      industry:     profile?.industry           || null,
      employees:    safeNum(profile?.employees) || null,
      website:      profile?.website            || null,
      description:  profile?.description        || null,
    };
  } catch {
    return {};
  }
}

/* ============================================================
   FMP STABLE API
   /stable/ratios        — PE, EPS, dividend yield
   /stable/profile       — market cap, beta, revenue, sector
   ============================================================ */

async function fetchFMP(symbol, apiKey) {
  const base = "https://financialmodelingprep.com/stable";

  try {
    const [ratiosRes, profileRes] = await Promise.all([
      fetch(`${base}/ratios?symbol=${symbol}&apikey=${apiKey}`),
      fetch(`${base}/profile?symbol=${symbol}&apikey=${apiKey}`),
    ]);

    const [ratiosData, profileData] = await Promise.all([
      ratiosRes.json(),
      profileRes.json(),
    ]);

    // /stable/ratios returns an array or object — handle both
    const r = Array.isArray(ratiosData)  ? ratiosData[0]  : ratiosData;
    const p = Array.isArray(profileData) ? profileData[0] : profileData;

    // Field names from FMP stable API
    const pe  = safeNum(r?.priceToEarningsRatio)
             ?? safeNum(r?.peRatio)
             ?? safeNum(r?.["Price to Earnings"])
             ?? safeNum(p?.pe)
             ?? null;

    const eps = safeNum(r?.earningsPerShare)
             ?? safeNum(r?.eps)
             ?? safeNum(p?.eps)
             ?? null;

    const _lastDiv = safeNum(p?.lastDiv);
    const _price   = safeNum(p?.price);
    const _calcYield = (_lastDiv != null && _price != null && _price > 0)
      ? _lastDiv / _price
      : null;

    const divYield = safeNum(r?.dividendYield)
                  ?? safeNum(r?.["Dividend Yield"])
                  ?? _calcYield;

    return {
      pe,
      eps,
      market_cap:     safeNum(p?.marketCap)   ?? safeNum(p?.mktCap)  ?? null,
      beta:           safeNum(p?.beta)                                ?? null,
      revenue:        safeNum(p?.revenue)      ?? safeNum(r?.revenue) ?? null,
      dividend_yield: typeof divYield === "boolean" ? null : divYield,
      sector:         p?.sector                                       || null,
      industry:       p?.industry                                     || null,
    };
  } catch {
    return {};
  }
}

/* ============================================================
   HELPERS
   ============================================================ */

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
