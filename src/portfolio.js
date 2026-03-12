// src/portfolio.js

const $ = (sel) => document.querySelector(sel);

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

const state = {
  users: [],
  portfolios: [],
  orders: [],
  selectedUserId: null,
  selectedUserName: "",
  selectedPortfolioId: null,
  selectedPortfolioName: "",
  selectedPortfolio: null
};

/* ============================================================
   HELPERS
   ============================================================ */

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fmtQty(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, {
    minimumFractionDigits: x % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
}

function safeText(v) {
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

function capitalizeWords(s) {
  return String(s || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function selectedUser() {
  return state.users.find((u) => Number(u.id) === Number(state.selectedUserId)) || null;
}

function selectedPortfolio() {
  return state.portfolios.find((p) => Number(p.id) === Number(state.selectedPortfolioId)) || null;
}

function resetSummary() {
  $("#summaryStartingCash").textContent = "$—";
  $("#summaryCash").textContent = "$—";
  $("#summaryExecutedCount").textContent = "—";
  $("#summaryOpenCount").textContent = "—";
}

function setHeaderMeta() {
  $("#selectedUserName").textContent = state.selectedUserName || "—";
  $("#selectedPortfolioName").textContent = state.selectedPortfolioName || "No portfolio selected";
  $("#metaUser").textContent = state.selectedUserName || "—";
  $("#metaPortfolio").textContent = state.selectedPortfolioName || "—";
}

/* ============================================================
   API
   ============================================================ */

async function getJson(url, options = {}) {
  const resp = await fetch(url, options);
  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new Error(data?.error || `Request failed: ${resp.status}`);
  }

  return data;
}

async function loadUsers() {
  const data = await getJson("/api/users");
  state.users = Array.isArray(data?.items) ? data.items : [];
  renderUsers();
}

async function loadPortfolios(userId) {
  const data = await getJson(`/api/portfolios?user_id=${encodeURIComponent(userId)}`);
  state.portfolios = Array.isArray(data?.items) ? data.items : [];
  renderPortfolios();
}

async function createPortfolio(userId, name) {
  return getJson("/api/portfolios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: Number(userId),
      name
    })
  });
}

async function loadOrders(portfolioId) {
  const data = await getJson(`/api/orders?portfolio_id=${encodeURIComponent(portfolioId)}`);
  state.orders = Array.isArray(data?.items) ? data.items : [];
  state.selectedPortfolio = data?.portfolio || selectedPortfolio() || null;
  renderOrders();
  renderSummary();
}

async function submitOrder(payload) {
  return getJson("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

/* ============================================================
   RENDER
   ============================================================ */

function renderUsers() {
  const sel = $("#userSelect");
  if (!sel) return;

  const current = String(state.selectedUserId || "");
  sel.innerHTML = `
    <option value="">Select user…</option>
    ${state.users.map((u) => `
      <option value="${u.id}" ${String(u.id) === current ? "selected" : ""}>
        ${u.name}
      </option>
    `).join("")}
  `;
}

function renderPortfolios() {
  const sel = $("#portfolioSelect");
  if (!sel) return;

  const current = String(state.selectedPortfolioId || "");
  sel.innerHTML = `
    <option value="">Select portfolio…</option>
    ${state.portfolios.map((p) => `
      <option value="${p.id}" ${String(p.id) === current ? "selected" : ""}>
        ${p.name}
      </option>
    `).join("")}
  `;
}

function renderOrders() {
  const body = $("#ordersTableBody");
  if (!body) return;

  if (!state.selectedPortfolioId) {
    body.innerHTML = `<tr><td colspan="9" class="empty">Select a user and portfolio to load orders.</td></tr>`;
    return;
  }

  if (!state.orders.length) {
    body.innerHTML = `<tr><td colspan="9" class="empty">No orders yet for this portfolio.</td></tr>`;
    return;
  }

  body.innerHTML = state.orders.map((o) => {
    const statusClass = o.status === "executed" ? "good" : "";
    const executed = o.executed_price !== null && o.executed_price !== undefined
      ? fmtMoney(o.executed_price)
      : "—";

    return `
      <tr>
        <td>${safeText(o.executed_at || o.created_at)}</td>
        <td>${safeText(o.symbol)}</td>
        <td>${capitalizeWords(o.side)}</td>
        <td>${fmtQty(o.quantity)}</td>
        <td>${capitalizeWords(o.order_type)}</td>
        <td class="${statusClass}">${capitalizeWords(o.status)}</td>
        <td>${executed}</td>
        <td>${safeText(o.cohort)}</td>
        <td>${safeText(o.event_rationale)}</td>
      </tr>
    `;
  }).join("");
}

function renderSummary() {
  if (!state.selectedPortfolio && !selectedPortfolio()) {
    resetSummary();
    return;
  }

  const portfolio = state.selectedPortfolio || selectedPortfolio();
  const startingCash = Number(portfolio?.starting_cash || 10000);

  let estimatedCash = startingCash;
  let executedCount = 0;
  let openCount = 0;

  for (const o of state.orders) {
    if (o.status === "executed") {
      executedCount += 1;

      const px = Number(o.executed_price);
      const qty = Number(o.quantity);

      if (Number.isFinite(px) && Number.isFinite(qty)) {
        if (o.side === "buy") estimatedCash -= qty * px;
        if (o.side === "sell") estimatedCash += qty * px;
      }
    } else if (o.status === "open") {
      openCount += 1;
    }
  }

  $("#summaryStartingCash").textContent = fmtMoney(startingCash);
  $("#summaryCash").textContent = fmtMoney(estimatedCash);
  $("#summaryExecutedCount").textContent = String(executedCount);
  $("#summaryOpenCount").textContent = String(openCount);
}

/* ============================================================
   SYMBOL RESOLUTION
   ============================================================ */

function resolveSymbolDisplay() {
  const input = $("#symbolInput");
  const out = $("#symbolResolvedText");
  if (!input || !out) return;

  const sym = String(input.value || "").trim().toUpperCase();
  input.value = sym;

  if (!sym) {
    out.textContent = "Enter a Dow 30 ticker to see name and cohort.";
    return;
  }

  const found = DOW30[sym];
  if (!found) {
    out.textContent = "Symbol is not in the Dow 30 universe.";
    return;
  }

  out.textContent = `${found.name} • ${found.cohort}`;
}

/* ============================================================
   EVENTS
   ============================================================ */

async function onUserChange() {
  const sel = $("#userSelect");
  const userId = Number(sel?.value || 0);

  state.selectedUserId = userId || null;
  state.selectedPortfolioId = null;
  state.selectedPortfolio = null;
  state.orders = [];
  state.portfolios = [];

  const user = selectedUser();
  state.selectedUserName = user?.name || "";
  state.selectedPortfolioName = "";

  setHeaderMeta();
  renderPortfolios();
  renderOrders();
  resetSummary();

  if (!state.selectedUserId) return;

  try {
    await loadPortfolios(state.selectedUserId);
  } catch (err) {
    alert(err.message);
  }
}

async function onPortfolioChange() {
  const sel = $("#portfolioSelect");
  const portfolioId = Number(sel?.value || 0);

  state.selectedPortfolioId = portfolioId || null;
  const portfolio = selectedPortfolio();

  state.selectedPortfolioName = portfolio?.name || "";
  state.selectedPortfolio = portfolio || null;

  setHeaderMeta();
  renderOrders();
  renderSummary();

  if (!state.selectedPortfolioId) return;

  try {
    await loadOrders(state.selectedPortfolioId);
    const selected = selectedPortfolio();
    state.selectedPortfolioName = selected?.name || state.selectedPortfolioName;
    setHeaderMeta();
  } catch (err) {
    alert(err.message);
  }
}

async function onCreatePortfolio() {
  const input = $("#newPortfolioName");
  const name = String(input?.value || "").trim();

  if (!state.selectedUserId) {
    alert("Select a user first.");
    return;
  }

  if (!name) {
    alert("Enter a portfolio name.");
    return;
  }

  try {
    await createPortfolio(state.selectedUserId, name);
    input.value = "";
    await loadPortfolios(state.selectedUserId);
  } catch (err) {
    alert(err.message);
  }
}

function buildOrderPayload() {
  if (!state.selectedPortfolioId) {
    throw new Error("Select a portfolio first.");
  }

  const symbol = String($("#symbolInput")?.value || "").trim().toUpperCase();
  const side = String($("#sideSelect")?.value || "buy").trim().toLowerCase();
  const quantity = Number($("#quantityInput")?.value);
  const orderType = String($("#orderTypeSelect")?.value || "market").trim();
  const timeInForce = String($("#timeInForceSelect")?.value || "none").trim();
  const currentPrice = Number($("#currentPriceInput")?.value);
  const limitPriceRaw = $("#limitPriceInput")?.value;
  const stopPriceRaw = $("#stopPriceInput")?.value;
  const trailingPercentRaw = $("#trailingPercentInput")?.value;
  const eventRationale = String($("#eventRationaleSelect")?.value || "").trim();
  const notes = String($("#orderNotesInput")?.value || "").trim();

  if (!DOW30[symbol]) {
    throw new Error("Symbol must be one of the Dow 30 names.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than 0.");
  }

  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    throw new Error("Current Price must be greater than 0.");
  }

  const payload = {
    portfolio_id: Number(state.selectedPortfolioId),
    symbol,
    side,
    quantity,
    order_type: orderType,
    time_in_force: timeInForce,
    event_rationale: eventRationale || null,
    notes: notes || null,
    current_price: currentPrice
  };

  if (limitPriceRaw !== "") payload.limit_price = Number(limitPriceRaw);
  if (stopPriceRaw !== "") payload.stop_price = Number(stopPriceRaw);
  if (trailingPercentRaw !== "") payload.trailing_percent = Number(trailingPercentRaw);

  return payload;
}

async function onSubmitOrder() {
  try {
    const payload = buildOrderPayload();
    await submitOrder(payload);

    await loadOrders(state.selectedPortfolioId);
    clearOrderForm();
  } catch (err) {
    alert(err.message);
  }
}

function clearOrderForm() {
  $("#quantityInput").value = "";
  $("#currentPriceInput").value = "";
  $("#limitPriceInput").value = "";
  $("#stopPriceInput").value = "";
  $("#trailingPercentInput").value = "";
  $("#eventRationaleSelect").value = "";
  $("#orderNotesInput").value = "";
}

/* ============================================================
   INIT
   ============================================================ */

function wireEvents() {
  $("#userSelect")?.addEventListener("change", onUserChange);
  $("#portfolioSelect")?.addEventListener("change", onPortfolioChange);
  $("#createPortfolioBtn")?.addEventListener("click", onCreatePortfolio);
  $("#submitOrderBtn")?.addEventListener("click", onSubmitOrder);
  $("#symbolInput")?.addEventListener("input", resolveSymbolDisplay);
  $("#symbolInput")?.addEventListener("blur", resolveSymbolDisplay);
}

async function boot() {
  wireEvents();
  setHeaderMeta();
  resetSummary();
  resolveSymbolDisplay();

  try {
    await loadUsers();
  } catch (err) {
    alert(`Unable to load users: ${err.message}`);
  }
}

boot();
