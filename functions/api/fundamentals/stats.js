// functions/api/fundamentals/stats.js
// Fetches P/E, EPS, Market Cap, 52-week high/low, Beta, Revenue, Yield
// from TwelveData for a given symbol.
// Usage: GET /api/fundamentals/stats?symbol=AAPL

export async function onRequestGet(ctx) {
  const { searchParams } = new URL(ctx.request.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase().trim();

  if (!symbol) return json({ error: "symbol required" }, 400);

  const apiKey = ctx.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return json({ error: "TWELVE_DATA_API_KEY not configured" }, 500);

  // Check KV cache first (6 hour TTL)
  const cacheKey = `fundamentals:stats:v2:${symbol}`;
  try {
    const cached = await ctx.env.MCM_KV.get(cacheKey, "json");
    if (cached) return json({ ...cached, _cached: true });
  } catch {}

  const base = `https://api.twelvedata.com`;
  const key  = `apikey=${apiKey}`;

  try {
    const [statsRes, profileRes, incomeRes, quoteRes] = await Promise.all([
      fetch(`${base}/statistics?symbol=${symbol}&${key}`),
      fetch(`${base}/profile?symbol=${symbol}&${key}`),
      fetch(`${base}/income_statement?symbol=${symbol}&period=annual&${key}`),
      fetch(`${base}/quote?symbol=${symbol}&${key}`),
    ]);

    const [stats, profile, income, quote] = await Promise.all([
      statsRes.json(),
      profileRes.json(),
      incomeRes.json(),
      quoteRes.json(),
    ]);

    const val = stats?.statistics?.valuations_metrics || {};
    const sk  = stats?.statistics?.stock_statistics  || {};

    // Revenue from most recent annual income statement
    const incomeData = Array.isArray(income?.income_statement)
      ? income.income_statement[0]
      : null;

    const result = {
      symbol,
      pe:           safeNum(val?.trailing_pe)        ?? safeNum(quote?.pe)              ?? null,
      eps:          safeNum(val?.diluted_eps_ttm)     ?? safeNum(quote?.eps)             ?? null,
      market_cap:   safeNum(val?.market_capitalization) ?? safeNum(profile?.market_cap)  ?? null,
      week_52_high: safeNum(sk?.["52_week_high"])     ?? safeNum(quote?.fifty_two_week?.high) ?? null,
      week_52_low:  safeNum(sk?.["52_week_low"])      ?? safeNum(quote?.fifty_two_week?.low)  ?? null,
      beta:         safeNum(sk?.beta)                 ?? safeNum(quote?.beta)            ?? null,
      revenue:      safeNum(incomeData?.total_revenue) ?? safeNum(incomeData?.revenue)   ?? null,
      dividend_yield: safeNum(quote?.dividend_yield)  ?? safeNum(val?.forward_dividend_yield) ?? null,
      sector:       profile?.sector      || null,
      industry:     profile?.industry    || null,
      employees:    profile?.employees   || null,
      website:      profile?.website     || null,
      description:  profile?.description || null,
    };

    // Cache 6 hours
    try {
      await ctx.env.MCM_KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 21600 });
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
