export async function onRequestGet(context) {
  const { env } = context;

  if (!env.FINNHUB_API_KEY) {
    return Response.json({ error: "Missing FINNHUB_API_KEY" }, { status: 500 });
  }

  const url = new URL("https://finnhub.io/api/v1/news");
  url.searchParams.set("category", "general");
  url.searchParams.set("token", env.FINNHUB_API_KEY);

  try {
    const resp = await fetch(url.toString(), {
      headers: { "Accept": "application/json" }
    });

    if (!resp.ok) {
      const text = await resp.text();
      return Response.json(
        { error: "Finnhub news request failed", status: resp.status, detail: text },
        { status: 502 }
      );
    }

    const data = await resp.json();

    const cleaned = Array.isArray(data)
      ? data
          .filter(item => item && item.headline && item.url)
          .slice(0, 12)
          .map(item => ({
            headline: item.headline,
            url: item.url,
            source: item.source || "",
            datetime: item.datetime || null
          }))
      : [];

    return Response.json({ items: cleaned }, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: "Unable to fetch market news", detail: String(err) },
      { status: 500 }
    );
  }
}
