// functions/api/fundamentals/stats.js
// Primary source: /quote (reliable across all Dow 30 on Grow plan)
// Secondary: /profile for description, sector, industry
// Usage: GET /api/fundamentals/stats?symbol=JNJ

export async function onRequestGet(ctx) {
  const { searchParams } = new URL(ctx.request.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase().trim();

  if (!symbol) return json({ error: "symbol required" }, 400);

  const apiKey = ctx.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return json({ error: "TWELVE_DATA_API_KEY not configured" }, 500);

  // KV cache — 6 hours
  const cacheKey = `fundamentals:stats:v3:${symbol}`;
  try {
    const cached = await ctx.env.MCM_KV.get(cacheKey, "json");
    if (cached) return json({ ...cached, _cached: true });
  } catch {}

  const base = `https://api.twelvedata.com`;
  const k    = `apikey=${apiKey}`;

  try {
    // quote is the most reliable endpoint across all plan tiers
    // profile gives us description + sector + industry
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`${base}/quote?symbol=${symbol}&${k}`),
      fetch(`${base}/profile?symbol=${symbol}&${k}`),
    ]);

    const [quote, profile] = await Promise.all([
      quoteRes.json(),
      profileRes.json(),
    ]);

    // quote fields — these are reliable on Grow plan
    const fw = quote?.fifty_two_week || {};

    const result = {
      symbol,
      pe:             safeNum(quote?.pe)               ?? null,
      eps:            safeNum(quote?.eps)              ?? null,
      market_cap:     safeNum(quote?.market_cap)       ?? null,
      week_52_high:   safeNum(fw.high)                 ?? null,
      week_52_low:    safeNum(fw.low)                  ?? null,
      beta:           safeNum(quote?.beta)             ?? null,
      revenue:        null, // not in quote; extracted from description text
      dividend_yield: safeNum(quote?.dividend_yield)   ?? null,
      sector:         profile?.sector                  || quote?.sector   || null,
      industry:       profile?.industry                || null,
      employees:      safeNum(profile?.employees)      || null,
      website:        profile?.website                 || null,
      description:    profile?.description             || null,
    };

    // Cache 6 hours
    try {
      await ctx.env.MCM_KV.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 21600,
      });
    } catch {}

    return json(result);

  } catch (err) {
    return json({ error: "fetch failed", detail: String(err) }, 502);
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
