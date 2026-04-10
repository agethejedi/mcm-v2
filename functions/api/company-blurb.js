// functions/api/company-blurb.js
// Generates a 2-sentence company description using OpenAI.
// Results are cached permanently in KV — OpenAI is only called once per ticker.
// Usage: GET /api/company-blurb?symbol=AAPL&name=Apple

export async function onRequestGet(ctx) {
  const { searchParams } = new URL(ctx.request.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase().trim();
  const name   = (searchParams.get("name")   || symbol).trim();

  if (!symbol) {
    return json({ error: "symbol required" }, 400);
  }

  // Check KV cache — blurbs are cached indefinitely (companies don't change)
  const cacheKey = `blurb:v1:${symbol}`;
  try {
    const cached = await ctx.env.MCM_KV.get(cacheKey, "json");
    if (cached?.blurb) {
      return json({ symbol, blurb: cached.blurb, _cached: true });
    }
  } catch {}

  const apiKey = ctx.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: "OPENAI_API_KEY not configured" }, 500);
  }

  try {
    const prompt = `Write exactly 2 concise sentences describing what ${name} (${symbol}) does as a business. Focus on their primary revenue source and market position. Do not include financial metrics, stock price, or investment advice. Plain text only, no formatting.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a financial data assistant. Write brief, factual company descriptions. Always respond with exactly 2 sentences.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 120,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return json({ error: "OpenAI request failed", detail: err }, 502);
    }

    const data = await res.json();
    const blurb = data?.choices?.[0]?.message?.content?.trim() || null;

    if (!blurb) {
      return json({ error: "No blurb returned from OpenAI" }, 502);
    }

    // Cache permanently in KV
    try {
      await ctx.env.MCM_KV.put(cacheKey, JSON.stringify({ blurb }));
    } catch {}

    return json({ symbol, blurb, _cached: false });

  } catch (err) {
    return json({ error: "OpenAI fetch failed", detail: String(err) }, 502);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
