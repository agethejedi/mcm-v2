export async function onRequest(context) {
  const { request, env } = context;

  if (!env.DB) {
    return Response.json({ error: "Missing D1 binding DB" }, { status: 500 });
  }

  const method = request.method.toUpperCase();

  if (method === "GET") {
    return handleGet(request, env);
  }

  if (method === "POST") {
    return handlePost(request, env);
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

async function handleGet(request, env) {
  try {
    const url = new URL(request.url);
    const userId = Number(url.searchParams.get("user_id"));

    if (!Number.isInteger(userId) || userId <= 0) {
      return Response.json(
        { error: "Missing or invalid user_id" },
        { status: 400 }
      );
    }

    const user = await env.DB
      .prepare("SELECT id, name FROM users WHERE id = ?")
      .bind(userId)
      .first();

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const portfolios = await env.DB
      .prepare(`
        SELECT
          id,
          user_id,
          name,
          starting_cash,
          created_at
        FROM portfolios
        WHERE user_id = ?
        ORDER BY created_at ASC, id ASC
      `)
      .bind(userId)
      .all();

    return Response.json({
      user,
      items: portfolios.results || []
    });
  } catch (err) {
    return Response.json(
      { error: "Unable to load portfolios", detail: String(err) },
      { status: 500 }
    );
  }
}

async function handlePost(request, env) {
  try {
    const body = await request.json().catch(() => null);

    const userId = Number(body?.user_id);
    const rawName = String(body?.name || "").trim();
    const name = rawName.replace(/\s+/g, " ");

    if (!Number.isInteger(userId) || userId <= 0) {
      return Response.json(
        { error: "Missing or invalid user_id" },
        { status: 400 }
      );
    }

    if (!name) {
      return Response.json(
        { error: "Portfolio name is required" },
        { status: 400 }
      );
    }

    if (name.length > 60) {
      return Response.json(
        { error: "Portfolio name must be 60 characters or fewer" },
        { status: 400 }
      );
    }

    const user = await env.DB
      .prepare("SELECT id, name FROM users WHERE id = ?")
      .bind(userId)
      .first();

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const countRow = await env.DB
      .prepare("SELECT COUNT(*) AS count FROM portfolios WHERE user_id = ?")
      .bind(userId)
      .first();

    const portfolioCount = Number(countRow?.count || 0);
    if (portfolioCount >= 3) {
      return Response.json(
        { error: "This user already has the maximum of 3 portfolios" },
        { status: 400 }
      );
    }

    const duplicate = await env.DB
      .prepare(`
        SELECT id
        FROM portfolios
        WHERE user_id = ?
          AND lower(name) = lower(?)
        LIMIT 1
      `)
      .bind(userId, name)
      .first();

    if (duplicate) {
      return Response.json(
        { error: "A portfolio with that name already exists for this user" },
        { status: 400 }
      );
    }

    const insert = await env.DB
      .prepare(`
        INSERT INTO portfolios (user_id, name, starting_cash)
        VALUES (?, ?, 10000)
      `)
      .bind(userId, name)
      .run();

    const newId = insert.meta?.last_row_id;
    if (!newId) {
      return Response.json(
        { error: "Portfolio was not created" },
        { status: 500 }
      );
    }

    const created = await env.DB
      .prepare(`
        SELECT
          id,
          user_id,
          name,
          starting_cash,
          created_at
        FROM portfolios
        WHERE id = ?
      `)
      .bind(newId)
      .first();

    return Response.json(
      {
        ok: true,
        item: created
      },
      { status: 201 }
    );
  } catch (err) {
    return Response.json(
      { error: "Unable to create portfolio", detail: String(err) },
      { status: 500 }
    );
  }
}
