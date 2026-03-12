export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return Response.json({ error: "Missing D1 binding DB" }, { status: 500 });
  }

  try {
    const result = await env.DB
      .prepare("SELECT id, name FROM users ORDER BY name ASC")
      .all();

    return Response.json({
      items: result.results || []
    });
  } catch (err) {
    return Response.json(
      { error: "Unable to load users", detail: String(err) },
      { status: 500 }
    );
  }
}
