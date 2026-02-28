// src/periodic.js
import { getSnapshot, getActiveEvent, getDividends, getEarnings } from "./api.js";

const $ = (sel) => document.querySelector(sel);

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return (x * 100).toFixed(2) + "%";
}

function safeText(s) {
  return (s === null || s === undefined) ? "" : String(s);
}

function isMobile() {
  return window.matchMedia("(max-width: 900px)").matches;
}

/* -------------------------
   Off-canvas panel controls
   ------------------------- */

const sidePanel = $("#sidePanel");
const overlay = $("#panelOverlay");
const closeBtn = $("#cardClose");

function openPanel() {
  if (!sidePanel) return;
  sidePanel.classList.add("open");
  overlay?.classList.add("show");
}

function closePanel() {
  if (!sidePanel) return;
  sidePanel.classList.remove("open");
  overlay?.classList.remove("show");
}

function wirePanelClose() {
  // overlay click closes (desktop)
  overlay?.addEventListener("click", closePanel);

  // top-right X closes
  closeBtn?.addEventListener("click", () => {
    closePanel();
    hideSideCard();
    closeSheet();
  });

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePanel();
      hideSideCard();
      closeSheet();
    }
  });
}

/* -------------------------
   Cohorts + tiles
   ------------------------- */

function cohortLabel(key) {
  const map = {
    liquidity_leader: "Liquidity Leaders",
    reflex_bounce: "Reflex / Growth",
    macro_sensitive: "Macro-Sensitive",
    cyclicals_industrials: "Cyclicals / Industrials",
    defensive_yield: "Defensive / Yield",
    ai_exposure: "AI Exposure",
    cyclical: "Cyclicals / Industrials",
    defensive: "Defensive / Yield",
  };
  return map[key] || key || "Cohort";
}

function groupByCohort(list) {
  const out = {};
  for (const s of list) {
    const k = s.cohort || s.cohort_key || s.group || "other";
    if (!out[k]) out[k] = [];
    out[k].push(s);
  }
  return out;
}

function buildDefaultLinks(symbol, name) {
  const sym = encodeURIComponent(symbol);
  const q = encodeURIComponent(`${symbol} investor relations`);
  return [
    { label: "Investor Relations (search)", href: `https://www.google.com/search?q=${q}` },
    { label: "SEC filings (EDGAR)", href: `https://www.sec.gov/edgar/search/#/q=${sym}` },
    { label: "Yahoo Finance", href: `https://finance.yahoo.com/quote/${sym}` },
  ];
}

function renderLinks(el, links) {
  if (!el) return;
  el.innerHTML = "";
  for (const l of links) {
    const a = document.createElement("a");
    a.className = "linkItem";
    a.href = l.href;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = l.label;
    el.appendChild(a);
  }
}

function tileTemplate(s) {
  return `
    <button class="pTile" data-symbol="${s.symbol}" aria-label="${s.symbol} tile">
      <div class="pTop">
        <div class="pSym">${s.symbol}</div>
        <div class="pPrice" id="pPrice-${s.symbol}">$—</div>
      </div>
      <div class="pName">${safeText(s.name || s.company || "")}</div>
      <div class="pSub">${safeText(s.category || s.sector || "")}</div>
      <div class="pChg" id="pChg-${s.symbol}">—</div>
    </button>
  `;
}

function renderCohorts(container, symbols) {
  const grouped = groupByCohort(symbols);

  const order = [
    "liquidity_leader",
    "reflex_bounce",
    "macro_sensitive",
    "cyclicals_industrials",
    "defensive_yield",
    "ai_exposure",
    "other",
    "cyclical",
    "defensive",
  ];

  const cols = [];
  for (const key of order) {
    if (!grouped[key]?.length) continue;

    const list = grouped[key].slice().sort((a, b) => (a.symbol || "").localeCompare(b.symbol || ""));
    cols.push(`
      <section class="pCol">
        <div class="pColHead">
          <div class="pColTitle">${cohortLabel(key)}</div>
          <div class="pColCount">${list.length} names</div>
        </div>
        <div class="pColBody">
          ${list.map(tileTemplate).join("")}
        </div>
      </section>
    `);
  }

  container.innerHTML = cols.join("");
}

/* -------------------------
   Regime banner (minimal)
   ------------------------- */

function setRegimeBanner({ title, sub, meta }) {
  $("#homeRegimeTitle").textContent = title || "MARKET REGIME: —";
  $("#homeRegimeSub").textContent = sub || "—";
  $("#homeRegimeMeta").textContent = meta || "—";
}

/* -------------------------
   Side card + mobile sheet
   ------------------------- */

function showSideCard() {
  $("#sideEmpty")?.classList.add("hidden");
  $("#sideCard")?.classList.remove("hidden");
}

function hideSideCard() {
  $("#sideCard")?.classList.add("hidden");
  $("#sideEmpty")?.classList.remove("hidden");
}

function openSheet(html) {
  $("#sheetBody").innerHTML = html;
  $("#sheetOverlay").classList.remove("hidden");
  $("#sheet").classList.remove("hidden");
}

function closeSheet() {
  $("#sheetOverlay").classList.add("hidden");
  $("#sheet").classList.add("hidden");
}

function cardHtmlFromDom() {
  const sym = safeText($("#cardSym")?.textContent);
  const name = safeText($("#cardName")?.textContent);
  const cat = safeText($("#cardCat")?.textContent);
  const price = safeText($("#cardPrice")?.textContent);
  const chg = safeText($("#cardChg")?.textContent);
  const blurb = safeText($("#cardBlurb")?.textContent);
  const pe = safeText($("#cardPE")?.textContent);
  const yld = safeText($("#cardYield")?.textContent);
  const ex = safeText($("#cardEx")?.textContent);
  const pay = safeText($("#cardPay")?.textContent);

  const links = Array.from($("#cardLinks")?.querySelectorAll("a") || []).map(a => ({
    label: a.textContent,
    href: a.href
  }));

  return `
    <div class="sideCard">
      <div class="sideHeader">
        <div>
          <div class="sideSym">${sym}</div>
          <div class="sideName">${name}</div>
          <div class="sideCat">${cat}</div>
        </div>
        <button class="xbtn" id="sheetClose" aria-label="Close">×</button>
      </div>

      <div class="sidePrice">
        <div class="priceBig">${price}</div>
        <div class="priceSub">${chg}</div>
      </div>

      <div class="sideSection">
        <div class="sideSectionTitle">What the company does</div>
        <div class="sideText">${blurb}</div>
      </div>

      <div class="sideSection">
        <div class="sideSectionTitle">Quick stats</div>
        <div class="kv">
          <div>P/E:</div><div>${pe}</div>
          <div>Yield:</div><div>${yld}</div>
          <div>Ex-date:</div><div>${ex}</div>
          <div>Pay date:</div><div>${pay}</div>
        </div>
      </div>

      <div class="sideSection">
        <div class="sideSectionTitle">Links</div>
        <div class="linkList">
          ${links.map(l => `<a class="linkItem" href="${l.href}" target="_blank" rel="noreferrer">${l.label}</a>`).join("")}
        </div>
      </div>
    </div>
  `;
}

async function populateCompanyCard(symbolsBySym, snap, sym) {
  const s = symbolsBySym[sym];
  if (!s) return;

  const d = snap?.[sym] || {};
  const last = Number(d.last);

  // NOTE: v2 snapshot may not include prev close; try a few common keys
  const prev = Number(
    d?.meta?.previous_close ??
    d?.previous_close ??
    snap?._meta?.previous_close ??
    NaN
  );

  // Header
  $("#cardSym").textContent = s.symbol;
  $("#cardName").textContent = s.name || s.company || "—";
  $("#cardCat").textContent = s.category || s.sector || "—";

  // Price + change
  $("#cardPrice").textContent = Number.isFinite(last) ? `$${fmtMoney(last)}` : "—";
  let chgText = "—";
  if (Number.isFinite(last) && Number.isFinite(prev) && prev !== 0) {
    const chg = last - prev;
    const pct = chg / prev;
    const sign = chg >= 0 ? "+" : "";
    chgText = `${sign}$${fmtMoney(chg)} (${sign}${fmtPct(pct)}) vs prev close`;
  }
  $("#cardChg").textContent = chgText;

  // Blurb
  $("#cardBlurb").textContent = s.blurb || s.description || "—";

  // Links
  const links = Array.isArray(s.links) && s.links.length
    ? s.links
    : buildDefaultLinks(s.symbol, s.name);
  renderLinks($("#cardLinks"), links);

  // Reset stats
  $("#cardPE").textContent = "—";
  $("#cardYield").textContent = "—";
  $("#cardEx").textContent = "—";
  $("#cardPay").textContent = "—";

  // Dividends
  try {
    const div = await getDividends(sym);
    if (div?.dividends?.length) {
      const latest = div.dividends[0];
      const amt = Number(latest.amount);
      const ex = latest.ex_date || latest.exDate || null;
      const pay = latest.pay_date || latest.payDate || null;

      $("#cardEx").textContent = ex || "—";
      $("#cardPay").textContent = pay || "—";

      if (Number.isFinite(last) && Number.isFinite(amt) && last > 0) {
        const annual = amt * 4; // naive quarterly assumption
        $("#cardYield").textContent = fmtPct(annual / last);
      } else if (Number.isFinite(amt)) {
        $("#cardYield").textContent = `$${fmtMoney(amt)} (per period)`;
      }
    }
  } catch {
    // ignore
  }

  // Earnings (optional)
  try {
    const ern = await getEarnings(sym);
    const peFromApi = Number(ern?.pe ?? ern?.fundamentals?.pe);
    if (Number.isFinite(peFromApi)) $("#cardPE").textContent = peFromApi.toFixed(2);
  } catch {
    // ignore
  }

  // Show contents
  showSideCard();

  // Desktop: open off-canvas panel
  if (!isMobile()) openPanel();

  // Mobile: open sheet (still preferred UX)
  if (isMobile()) {
    openSheet(cardHtmlFromDom());
    const btn = $("#sheetClose");
    if (btn) btn.addEventListener("click", closeSheet, { once: true });
  }
}

async function refreshTiles(symbols, snap) {
  for (const s of symbols) {
    const d = snap?.[s.symbol] || {};
    const last = Number(d.last);

    const prev = Number(
      d?.meta?.previous_close ??
      d?.previous_close ??
      NaN
    );

    const priceEl = $(`#pPrice-${s.symbol}`);
    const chgEl = $(`#pChg-${s.symbol}`);

    if (priceEl) priceEl.textContent = Number.isFinite(last) ? `$${fmtMoney(last)}` : "$—";

    if (chgEl) {
      if (Number.isFinite(last) && Number.isFinite(prev) && prev !== 0) {
        const chg = last - prev;
        const pct = chg / prev;
        const sign = chg >= 0 ? "+" : "";
        chgEl.textContent = `${sign}${fmtMoney(chg)} (${sign}${fmtPct(pct)})`;
        chgEl.classList.toggle("pos", chg > 0);
        chgEl.classList.toggle("neg", chg < 0);
      } else {
        chgEl.textContent = "—";
        chgEl.classList.remove("pos", "neg");
      }
    }
  }
}

/* -------------------------
   Boot
   ------------------------- */

async function boot() {
  const cfg = await import("./config.js");
  const SYMBOLS =
    cfg.DOW30 ||
    cfg.SYMBOLS ||
    cfg.symbols ||
    [];

  const UI_REFRESH_MS = Number(cfg.UI_REFRESH_MS) || 60_000;

  const symbols = SYMBOLS.map(s => ({
    symbol: String(s.symbol || "").toUpperCase(),
    name: s.name || s.company || "",
    category: s.category || s.sector || "",
    cohort: s.cohort || s.cohort_key || s.group,
    blurb: s.blurb || s.description || "",
    links: s.links || null,
  })).filter(s => s.symbol);

  const symbolsBySym = Object.fromEntries(symbols.map(s => [s.symbol, s]));

  renderCohorts($("#periodicRow"), symbols);

  // Close wiring
  wirePanelClose();
  $("#sheetOverlay")?.addEventListener("click", closeSheet);

  // Active event line
  try {
    const active = await getActiveEvent();
    $("#homeEventLine").textContent = active?.title ? `Active event: ${active.title}` : "Active event: —";
  } catch {
    $("#homeEventLine").textContent = "Active event: —";
  }

  async function refresh() {
    let snap = null;
    try {
      snap = await getSnapshot(symbols.map(s => s.symbol));
    } catch {
      setRegimeBanner({
        title: "MARKET REGIME: —",
        sub: "Unable to load snapshot.",
        meta: "—",
      });
      return;
    }

    $("#asof").textContent = snap?._meta?.asof_local || snap?._meta?.asof_market || "—";

    setRegimeBanner({
      title: "MARKET REGIME: —",
      sub: snap?._meta?.note || "Backend enforces credits-aware cadence via KV caching.",
      meta: snap?._meta?.source ? `Source: ${snap._meta.source}` : "—",
    });

    await refreshTiles(symbols, snap);

    // Wire tile clicks (once)
    document.querySelectorAll(".pTile").forEach((btn) => {
      if (btn.dataset.wired === "1") return;
      btn.dataset.wired = "1";

      btn.addEventListener("click", async () => {
        const sym = btn.getAttribute("data-symbol");

        // visual selection highlight (optional)
        document.querySelectorAll(".pTile.selected").forEach(x => x.classList.remove("selected"));
        btn.classList.add("selected");

        await populateCompanyCard(symbolsBySym, snap, sym);
      });
    });
  }

  await refresh();
  setInterval(() => refresh().catch(() => {}), UI_REFRESH_MS);
}

boot();
