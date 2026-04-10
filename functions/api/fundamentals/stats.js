// functions/api/fundamentals/stats.js
// Fetches P/E, EPS, Market Cap, 52-week high/low, Beta, Revenue, Yield
// from TwelveData for a given symbol.
// Usage: GET /api/fundamentals/stats?symbol=AAPL

export async function onRequestGet(ctx) {
  const { searchParams } = new URL(ctx.request.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase().trim();

  if (!symbol) {
    return json({ error: "symbol required" }, 400);
  }

  const apiKey = ctx.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return json({ error: "TWELVE_DATA_API_KEY not configured" }, 500);
  }

  // Check KV cache first (cache for 6 hours)
  const cacheKey = `fundamentals:stats:${symbol}`;
  try {
    const cached = await ctx.env.MCM_KV.get(cacheKey, "json");
    if (cached) {
      return json({ ...cached, _cached: true });
    }
  } catch {}

  // Fetch from TwelveData — statistics endpoint
  const statsUrl = `https://api.twelvedata.com/statistics?symbol=${symbol}&apikey=${apiKey}`;
  const profileUrl = `https://api.twelvedata.com/profile?symbol=${symbol}&apikey=${apiKey}`;
  const quoteUrl = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`;

  try {
    const [statsRes, profileRes, quoteRes] = await Promise.all([
      fetch(statsUrl),
      fetch(profileUrl),
      fetch(quoteUrl),
    ]);

    const [stats, profile, quote] = await Promise.all([
      statsRes.json(),
      profileRes.json(),
      quoteRes.json(),
    ]);

    // Extract the fields we want
    const vs = stats?.statistics?.valuations_metrics || {};
    const fs = stats?.statistics?.financials || {};
    const sk = stats?.statistics?.stock_statistics || {};

    const result = {
      symbol,

      // Valuation
      pe:         safeNum(vs.trailing_pe)        ?? safeNum(quote?.pe),
      eps:        safeNum(vs.diluted_eps_ttm)     ?? null,
      market_cap: safeNum(vs.market_capitalization) ?? null,

      // Price range
      week_52_high: safeNum(sk["52_week_high"])  ?? safeNum(quote?.fifty_two_week?.high),
      week_52_low:  safeNum(sk["52_week_low"])   ?? safeNum(quote?.fifty_two_week?.low),

      // Risk
      beta: safeNum(sk.beta) ?? null,

      // Revenue
      revenue: safeNum(fs.total_revenue) ?? null,

      // Yield — from quote
      dividend_yield: safeNum(quote?.dividend_yield) ?? null,

      // Company info from profile
      sector:       profile?.sector       || null,
      industry:     profile?.industry     || null,
      employees:    profile?.employees    || null,
      website:      profile?.website      || null,
      exchange:     profile?.exchange     || null,
      description:  profile?.description  || null,
    };

    // Cache for 6 hours (21600 seconds)
    try {
      await ctx.env.MCM_KV.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 21600,
      });
    } catch {}

    return json(result);

  } catch (err) {
    return json({ error: "TwelveData fetch failed", detail: String(err) }, 502);
  }
}

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
