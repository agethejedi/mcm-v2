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

/* ============================================================
   STATIC DOW 30 COHORT MAP
   ============================================================ */

const DOW30 = {
  MMM: { name: "3M", cohort: "Cyclicals / Industrials" },
  AXP: { name: "American Express", cohort: "Macro-Sensitive" },
  AMGN: { name: "Amgen", cohort: "Defensive / Yield" },
  AAPL: { name: "Apple", cohort: "Liquidity Leaders" },
  BA: { name: "Boeing", cohort: "Cyclicals / Industrials" },
  CAT: { name: "Caterpillar", cohort: "Cyclicals / Industrials" },
  CVX: { name: "Chevron", cohort: "Macro-Sensitive" },
  CSCO: { name: "Cisco", cohort: "Defensive / Yield" },
  KO: { name: "Coca-Cola", cohort: "Defensive / Yield" },
  DIS: { name: "Disney", cohort: "Reflex / Growth" },
  DOW: { name: "Dow", cohort: "Macro-Sensitive" },
  GS: { name: "Goldman Sachs", cohort: "Macro-Sensitive" },
  HD: { name: "Home Depot", cohort: "Cyclicals / Industrials" },
  HON: { name: "Honeywell", cohort: "Cyclicals / Industrials" },
  IBM: { name: "IBM", cohort: "Defensive / Yield" },
  JNJ: { name: "Johnson & Johnson", cohort: "Defensive / Yield" },
  JPM: { name: "JPMorgan Chase", cohort: "Macro-Sensitive" },
  MCD: { name: "McDonald's", cohort: "Defensive / Yield" },
  MRK: { name: "Merck", cohort: "Defensive / Yield" },
  MSFT: { name: "Microsoft", cohort: "Liquidity Leaders" },
  NKE: { name: "Nike", cohort: "Reflex / Growth" },
  PG: { name: "Procter & Gamble", cohort: "Defensive / Yield" },
  CRM: { name: "Salesforce", cohort: "Reflex / Growth" },
  SHW: { name: "Sherwin-Williams", cohort: "Cyclicals / Industrials" },
  TRV: { name: "Travelers", cohort: "Defensive / Yield" },
  UNH: { name: "UnitedHealth", cohort: "Defensive / Yield" },
  VZ: { name: "Verizon", cohort: "Defensive / Yield" },
  V: { name: "Visa", cohort: "Liquidity Leaders" },
  WMT: { name: "Walmart", cohort: "Defensive / Yield" },
  NVDA: { name: "NVIDIA", cohort: "Liquidity Leaders" }
};

const VALID_SIDES = new Set(["buy", "sell"]);
const VALID_ORDER_TYPES = new Set([
  "market",
  "limit",
  "stop",
  "stop_limit",
  "trailing_stop"
]);
const VALID_TIF = new Set(["none", "gtc"]);

/* ============================================================
   HELPERS
   ============================================================ */

function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

function normalizeSide(side) {
  return String(side || "").trim().toLowerCase();
}

function normalizeOrderType(orderType) {
  return String(orderType || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeTif(tif) {
  const value = String(tif || "none").trim().toLowerCase();
  return value || "none";
}

function numOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function textOrNull(value, maxLen = 300) {
  const s = String(value || "").trim();
  if (!s) return null;
  return s.slice(0, maxLen);
}

function serializeOrder(row) {
  return {
    id: row.id,
    portfolio_id: row.portfolio_id,
    symbol: row.symbol,
    side: row.side,
    quantity: Number(row.quantity),
    order_type: row.order_type,
    limit_price: row.limit_price === null ? null : Number(row.limit_price),
    stop_price: row.stop_price === null ? null : Number(row.stop_price),
    trailing_percent: row.trailing_percent === null ? null : Number(row.trailing_percent),
    time_in_force: row.time_in_force,
    event_rationale: row.event_rationale,
    notes: row.notes,
    cohort: row.cohort,
    status: row.status,
    executed_price: row.executed_price === null ? null : Number(row.executed_price),
    executed_at: row.executed_at,
    created_at: row.created_at
  };
}

function getEasternParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value;

  return {
    weekday: get("weekday"),
    hour: Number(get("hour")),
    minute: Number(get("minute"))
  };
}

function isRegularMarketOpen(date = new Date()) {
  const { weekday, hour, minute } = getEasternParts(date);

  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
  const dayNum = dayMap[weekday] || 0;

  if (dayNum < 1 || dayNum > 5) return false;

  const mins = hour * 60 + minute;
  const open = 9 * 60 + 30; // 9:30 ET
  const close = 16 * 60;    // 4:00 ET

  return mins >= open && mins < close;
}

async function getPortfolio(env, portfolioId) {
  return env.DB
    .prepare(`
      SELECT
        p.id,
        p.user_id,
        p.name,
        p.starting_cash,
        p.created_at,
        u.name AS user_name
      FROM portfolios p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
    `)
    .bind(portfolioId)
    .first();
}

async function getExecutedPosition(env, portfolioId, symbol) {
  const row = await env.DB
    .prepare(`
      SELECT
        COALESCE(SUM(
          CASE
            WHEN side = 'buy'  THEN quantity
            WHEN side = 'sell' THEN -quantity
            ELSE 0
          END
        ), 0) AS shares
      FROM orders
      WHERE portfolio_id = ?
        AND symbol = ?
        AND status = 'executed'
    `)
    .bind(portfolioId, symbol)
    .first();

  return Number(row?.shares || 0);
}

async function getPortfolioCash(env, portfolioId) {
  const portfolio = await env.DB
    .prepare(`
      SELECT id, starting_cash
      FROM portfolios
      WHERE id = ?
    `)
    .bind(portfolioId)
    .first();

  if (!portfolio) return null;

  const flows = await env.DB
    .prepare(`
      SELECT
        COALESCE(SUM(
          CASE
            WHEN status = 'executed' AND side = 'buy'  THEN -(quantity * executed_price)
            WHEN status = 'executed' AND side = 'sell' THEN  (quantity * executed_price)
            ELSE 0
          END
        ), 0) AS cash_delta
      FROM orders
      WHERE portfolio_id = ?
    `)
    .bind(portfolioId)
    .first();

  return Number(portfolio.starting_cash) + Number(flows?.cash_delta || 0);
}

function validateOrderPayload(body) {
  const symbol = normalizeSymbol(body?.symbol);
  const side = normalizeSide(body?.side);
  const quantity = numOrNull(body?.quantity);
  const orderType = normalizeOrderType(body?.order_type);
  const tif = normalizeTif(body?.time_in_force);

  const limitPrice = numOrNull(body?.limit_price);
  const stopPrice = numOrNull(body?.stop_price);
  const trailingPercent = numOrNull(body?.trailing_percent);

  const eventRationale = textOrNull(body?.event_rationale, 120);
  const notes = textOrNull(body?.notes, 500);

  if (!symbol || !DOW30[symbol]) {
    return { error: "Symbol must be one of the Dow 30 names" };
  }

  if (!VALID_SIDES.has(side)) {
    return { error: "Side must be buy or sell" };
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Quantity must be greater than 0" };
  }

  if (!VALID_ORDER_TYPES.has(orderType)) {
    return { error: "Invalid order_type" };
  }

  if (!VALID_TIF.has(tif)) {
    return { error: "time_in_force must be none or gtc" };
  }

  if (orderType === "limit" && (!Number.isFinite(limitPrice) || limitPrice <= 0)) {
    return { error: "Limit orders require a valid limit_price" };
  }

  if (orderType === "stop" && (!Number.isFinite(stopPrice) || stopPrice <= 0)) {
    return { error: "Stop orders require a valid stop_price" };
  }

  if (orderType === "stop_limit") {
    if (!Number.isFinite(stopPrice) || stopPrice <= 0) {
      return { error: "Stop limit orders require a valid stop_price" };
    }
    if (!Number.isFinite(limitPrice) || limitPrice <= 0) {
      return { error: "Stop limit orders require a valid limit_price" };
    }
  }

  if (orderType === "trailing_stop" && (!Number.isFinite(trailingPercent) || trailingPercent <= 0)) {
    return { error: "Trailing stop orders require a valid trailing_percent" };
  }

  return {
    value: {
      symbol,
      side,
      quantity,
      orderType,
      timeInForce: tif,
      limitPrice,
      stopPrice,
      trailingPercent,
      eventRationale,
      notes,
      cohort: DOW30[symbol].cohort
    }
  };
}

/* ============================================================
   EXECUTION RULES
   ============================================================ */

function evaluateExecution({
  side,
  orderType,
  currentPrice,
  limitPrice,
  stopPrice,
  trailingPercent
}) {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return { error: "current_price is required and must be greater than 0" };
  }

  if (orderType === "market") {
    return {
      shouldExecute: true,
      executedPrice: currentPrice,
      status: "executed"
    };
  }

  if (orderType === "limit") {
    const hit =
      (side === "buy" && currentPrice <= limitPrice) ||
      (side === "sell" && currentPrice >= limitPrice);

    return {
      shouldExecute: hit,
      executedPrice: hit ? limitPrice : null,
      status: hit ? "executed" : "open"
    };
  }

  if (orderType === "stop") {
    const hit =
      (side === "buy" && currentPrice >= stopPrice) ||
      (side === "sell" && currentPrice <= stopPrice);

    return {
      shouldExecute: hit,
      executedPrice: hit ? currentPrice : null,
      status: hit ? "executed" : "open"
    };
  }

  if (orderType === "stop_limit") {
    const stopHit =
      (side === "buy" && currentPrice >= stopPrice) ||
      (side === "sell" && currentPrice <= stopPrice);

    if (!stopHit) {
      return { shouldExecute: false, executedPrice: null, status: "open" };
    }

    const limitHit =
      (side === "buy" && currentPrice <= limitPrice) ||
      (side === "sell" && currentPrice >= limitPrice);

    return {
      shouldExecute: limitHit,
      executedPrice: limitHit ? limitPrice : null,
      status: limitHit ? "executed" : "open"
    };
  }

  if (orderType === "trailing_stop") {
    void trailingPercent;
    return {
      shouldExecute: false,
      executedPrice: null,
      status: "open"
    };
  }

  return { error: "Unsupported order type" };
}

/* ============================================================
   GET
   ============================================================ */

async function handleGet(request, env) {
  try {
    const url = new URL(request.url);
    const portfolioId = Number(url.searchParams.get("portfolio_id"));

    if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
      return Response.json(
        { error: "Missing or invalid portfolio_id" },
        { status: 400 }
      );
    }

    const portfolio = await getPortfolio(env, portfolioId);
    if (!portfolio) {
      return Response.json({ error: "Portfolio not found" }, { status: 404 });
    }

    const result = await env.DB
      .prepare(`
        SELECT
          id,
          portfolio_id,
          symbol,
          side,
          quantity,
          order_type,
          limit_price,
          stop_price,
          trailing_percent,
          time_in_force,
          event_rationale,
          notes,
          cohort,
          status,
          executed_price,
          executed_at,
          created_at
        FROM orders
        WHERE portfolio_id = ?
        ORDER BY datetime(created_at) DESC, id DESC
      `)
      .bind(portfolioId)
      .all();

    return Response.json({
      portfolio,
      items: (result.results || []).map(serializeOrder)
    });
  } catch (err) {
    return Response.json(
      { error: "Unable to load orders", detail: String(err) },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST
   ============================================================ */

async function handlePost(request, env) {
  try {
    const body = await request.json().catch(() => null);

    const portfolioId = Number(body?.portfolio_id);
    if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
      return Response.json(
        { error: "Missing or invalid portfolio_id" },
        { status: 400 }
      );
    }

    const portfolio = await getPortfolio(env, portfolioId);
    if (!portfolio) {
      return Response.json({ error: "Portfolio not found" }, { status: 404 });
    }

    const validated = validateOrderPayload(body);
    if (validated.error) {
      return Response.json({ error: validated.error }, { status: 400 });
    }

    const {
      symbol,
      side,
      quantity,
      orderType,
      timeInForce,
      limitPrice,
      stopPrice,
      trailingPercent,
      eventRationale,
      notes,
      cohort
    } = validated.value;

    const currentPrice = numOrNull(body?.current_price);

    const marketOpen = isRegularMarketOpen();

    let execution;
    if (!marketOpen) {
      execution = {
        shouldExecute: false,
        executedPrice: null,
        status: "open"
      };
    } else {
      execution = evaluateExecution({
        side,
        orderType,
        currentPrice,
        limitPrice,
        stopPrice,
        trailingPercent
      });
    }

    if (execution.error) {
      return Response.json({ error: execution.error }, { status: 400 });
    }

    if (execution.status === "executed" && side === "buy") {
      const cash = await getPortfolioCash(env, portfolioId);
      const requiredCash = quantity * Number(execution.executedPrice || 0);

      if (!Number.isFinite(cash) || cash < requiredCash) {
        return Response.json(
          {
            error: "Insufficient cash for this order",
            available_cash: cash,
            required_cash: requiredCash
          },
          { status: 400 }
        );
      }
    }

    if (execution.status === "executed" && side === "sell") {
      const shares = await getExecutedPosition(env, portfolioId, symbol);
      if (shares < quantity) {
        return Response.json(
          {
            error: "Insufficient shares for this sell order",
            available_shares: shares,
            requested_shares: quantity
          },
          { status: 400 }
        );
      }
    }

    if (execution.status === "open" && side === "sell") {
      const shares = await getExecutedPosition(env, portfolioId, symbol);
      if (shares < quantity) {
        return Response.json(
          {
            error: "Insufficient shares for this sell order",
            available_shares: shares,
            requested_shares: quantity
          },
          { status: 400 }
        );
      }
    }

    const nowIso = new Date().toISOString();

    const insert = await env.DB
      .prepare(`
        INSERT INTO orders (
          portfolio_id,
          symbol,
          side,
          quantity,
          order_type,
          limit_price,
          stop_price,
          trailing_percent,
          time_in_force,
          event_rationale,
          notes,
          cohort,
          status,
          executed_price,
          executed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        portfolioId,
        symbol,
        side,
        quantity,
        orderType,
        limitPrice,
        stopPrice,
        trailingPercent,
        timeInForce,
        eventRationale,
        notes,
        cohort,
        execution.status,
        execution.executedPrice,
        execution.status === "executed" ? nowIso : null
      )
      .run();

    const newId = insert.meta?.last_row_id;
    if (!newId) {
      return Response.json(
        { error: "Order was not created" },
        { status: 500 }
      );
    }

    const created = await env.DB
      .prepare(`
        SELECT
          id,
          portfolio_id,
          symbol,
          side,
          quantity,
          order_type,
          limit_price,
          stop_price,
          trailing_percent,
          time_in_force,
          event_rationale,
          notes,
          cohort,
          status,
          executed_price,
          executed_at,
          created_at
        FROM orders
        WHERE id = ?
      `)
      .bind(newId)
      .first();

    return Response.json(
      {
        ok: true,
        market_open: marketOpen,
        item: serializeOrder(created)
      },
      { status: 201 }
    );
  } catch (err) {
    return Response.json(
      { error: "Unable to create order", detail: String(err) },
      { status: 500 }
    );
  }
}
