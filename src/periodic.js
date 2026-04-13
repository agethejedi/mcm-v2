// src/periodic.js
import "./mobile.css";
import { getSnapshot, getActiveEvent, getDividends, getEarnings, getFundamentals } from "./api.js";

const $ = (sel) => document.querySelector(sel);
const DJIA_CANDIDATES = [".DJI", "^DJI", "DJI"];

/* ============================================================
   BASIC HELPERS
   ============================================================ */

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
  return s === null || s === undefined ? "" : String(s);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isMobile() {
  return true; // Mobile periodic table layout is now the default on all viewports
}

function getNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getPrevClose(d, snap) {
  return (
    getNum(d?.previous_close) ??
    getNum(d?.meta?.previous_close) ??
    getNum(snap?._meta?.previous_close) ??
    null
  );
}

/* ============================================================
   TOOLBAR / HEADER HELPERS
   ============================================================ */

function setAsOfLabels(snap) {
  const asof = snap?._meta?.asof_local || snap?._meta?.asof_market || "—";
  const asofMain = $("#asof");
  const asofToolbar = $("#asofToolbar");
  if (asofMain) asofMain.textContent = asof;
  if (asofToolbar) asofToolbar.textContent = asof;
}

/* ============================================================
   DJIA QUOTE STRIP
   ============================================================ */

function setDjiaQuoteFromData(d) {
  const lastEl = $("#djiaLast");
  const chgEl = $("#djiaChange");
  const pctEl = $("#djiaPct");

  if (!lastEl || !chgEl || !pctEl) return;

  if (!d) {
    lastEl.textContent = "—";
    chgEl.textContent = "—";
    pctEl.textContent = "—";
    chgEl.classList.remove("pos", "neg");
    pctEl.classList.remove("pos", "neg");
    return;
  }

  const last = Number(d?.last);
  const prev = Number(d?.previous_close) || Number(d?.meta?.previous_close) || NaN;

  if (!Number.isFinite(last) || !Number.isFinite(prev) || prev === 0) {
    lastEl.textContent = "—";
    chgEl.textContent = "—";
    pctEl.textContent = "—";
    chgEl.classList.remove("pos", "neg");
    pctEl.classList.remove("pos", "neg");
    return;
  }

  const chg = last - prev;
  const pct = chg / prev;
  const sign = chg >= 0 ? "+" : "";

  lastEl.textContent = fmtMoney(last);
  chgEl.textContent = `${sign}${fmtMoney(chg)}`;
  pctEl.textContent = `${sign}${fmtPct(pct)}`;

  chgEl.classList.remove("pos", "neg");
  pctEl.classList.remove("pos", "neg");

  if (chg > 0) {
    chgEl.classList.add("pos");
    pctEl.classList.add("pos");
  } else if (chg < 0) {
    chgEl.classList.add("neg");
    pctEl.classList.add("neg");
  }
}

async function refreshDjiaQuote() {
  for (const sym of DJIA_CANDIDATES) {
    try {
      const snap = await getSnapshot([sym]);
      const d = snap?.[sym];
      const last = Number(d?.last);
      if (d && Number.isFinite(last) && last > 1000) {
        setDjiaQuoteFromData(d);
        return;
      }
    } catch {
      // try next candidate
    }
  }
  setDjiaQuoteFromData(null);
}

/* ============================================================
   MARKET NEWS RAIL
   ============================================================ */

function renderNewsRail(items) {
  const track = $("#newsRailTrack");
  if (!track) return;

  if (!Array.isArray(items) || !items.length) {
    track.innerHTML = `<a class="newsItem muted" href="#" onclick="return false;">No market headlines available.</a>`;
    return;
  }

  const markup = items.map((item) => {
    const headline = escapeHtml(item.headline || "");
    const url = escapeHtml(item.url || "#");
    const source = escapeHtml(item.source || "");
    return `
      <a class="newsItem" href="${url}" target="_blank" rel="noreferrer">
        <span>${headline}</span>
        ${source ? `<span class="newsSource">${source}</span>` : ""}
      </a>
    `;
  }).join("");

  track.innerHTML = markup + markup;
}

async function refreshMarketNews() {
  try {
    const resp = await fetch("/api/market-news");
    if (!resp.ok) throw new Error(`News request failed: ${resp.status}`);
    const data = await resp.json();
    renderNewsRail(data?.items || []);
  } catch (err) {
    console.error("market news error", err);
    renderNewsRail([]);
  }
}

/* ============================================================
   COHORTS / TILE RENDER
   ============================================================ */

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

function tileTemplate(s) {
  return `
    <button class="pTile flat" data-symbol="${s.symbol}" aria-label="${s.symbol} tile">
      <div class="tileTop">
        <div class="tileLeft">
          <div class="pSym">${s.symbol}</div>
          <div class="pName">${safeText(s.name || s.company || "")}</div>
        </div>
        <div class="tileRight">
          <div class="pPrice" id="pPrice-${s.symbol}">$—</div>
        </div>
      </div>
      <div class="tileBottom">
        <div class="tileChangeBlock">
          <div class="tileDollar" id="pChgDollar-${s.symbol}">—</div>
          <div class="tilePct" id="pChgPct-${s.symbol}">—</div>
        </div>
        <span class="statusChip forming" id="pStatus-${s.symbol}">Setup</span>
      </div>
    </button>
  `;
}

function renderCohorts(container, symbols) {
  if (!container) return;

  const grouped = groupByCohort(symbols);

  const order = [
    "liquidity_leader",
    "reflex_bounce",
    "macro_sensitive",
    "cyclicals_industrials",
    "cyclical",
    "defensive_yield",
    "defensive",
    "ai_exposure",
    "other",
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

/* ============================================================
   EVENT BANNER
   ============================================================ */

function setRegimeBanner({ title, sub, meta, toneClass }) {
  const t = $("#homeRegimeTitle");
  const s = $("#homeRegimeSub");
  const m = $("#homeRegimeMeta");
  const box = $("#homeRegime");

  if (t) t.textContent = title || "MARKET REGIME: —";
  if (s) s.textContent = sub || "—";
  if (m) m.textContent = meta || "—";

  if (box) {
    box.classList.remove("evt-red", "evt-orange", "evt-blue", "evt-yellow", "evt-green", "evt-neutral");
    box.classList.add(toneClass || "evt-neutral");
  }
}

function isGreen(d, snap) {
  const last = getNum(d?.last);
  const prev = getPrevClose(d, snap);
  if (last === null || prev === null || prev === 0) return null;
  if (last === prev) return "flat";
  return last > prev;
}

function computeBreadth(symbols, snap) {
  let up = 0, down = 0, flat = 0, used = 0;

  for (const s of symbols) {
    const d = snap?.[s.symbol];
    if (!d) continue;
    const g = isGreen(d, snap);
    if (g === null) continue;
    used++;
    if (g === "flat") flat++;
    else if (g) up++;
    else down++;
  }

  const breadthUp = used ? up / used : 0;
  return { up, down, flat, used, breadthUp };
}

function countGreen(list, snap) {
  let up = 0, down = 0, flat = 0, used = 0;
  for (const sym of list) {
    const d = snap?.[sym];
    if (!d) continue;
    const g = isGreen(d, snap);
    if (g === null) continue;
    used++;
    if (g === "flat") flat++;
    else if (g) up++;
    else down++;
  }
  return { up, down, flat, used };
}

function detectEvent(symbols, snap) {
  const LEADERS = ["MSFT", "AAPL", "NVDA", "V"];
  const DEFENSIVES = ["PG", "KO", "JNJ", "MRK", "MCD", "VZ", "TRV", "CSCO", "WMT", "UNH", "AMGN"];
  const CYCLICALS = ["CAT", "HD", "BA", "MMM", "HON", "DIS", "CVX", "SHW", "AMZN"];
  const FINANCIALS = ["JPM", "GS", "AXP", "V"];

  const b = computeBreadth(symbols, snap);
  const leaders = countGreen(LEADERS, snap);
  const def = countGreen(DEFENSIVES, snap);
  const cyc = countGreen(CYCLICALS, snap);
  const fin = countGreen(FINANCIALS, snap);

  if (b.used >= 10 && b.breadthUp <= 0.25 && leaders.down >= 1 && def.up <= 2) {
    return {
      code: "panic",
      badge: "🟥",
      label: "Panic / Liquidation",
      toneClass: "evt-red",
      sub: "Broad selling pressure; little hiding place. Wait for exhaustion + first confirms.",
      meta: `Breadth: ${b.up}/${b.used} up • Leaders up ${leaders.up}/${leaders.used || 0} • Defensives up ${def.up}/${def.used || 0}`
    };
  }

  if (def.up >= 3 && (cyc.down >= 3 || fin.down >= 2)) {
    return {
      code: "policy",
      badge: "🟦",
      label: "Risk-Off Rotation (Policy / Geo)",
      toneClass: "evt-blue",
      sub: "Rotation into safety. Rebound candidates tend to be liquidity leaders + quality defensives first.",
      meta: `Defensives up ${def.up}/${def.used || 0} • Cyclicals down ${cyc.down}/${cyc.used || 0} • Financials down ${fin.down}/${fin.used || 0}`
    };
  }

  if ((cyc.down >= 3 && fin.down >= 2) && (leaders.used ? leaders.up <= 1 : true)) {
    return {
      code: "macro",
      badge: "🟧",
      label: "Macro Repricing",
      toneClass: "evt-orange",
      sub: "Economic expectations shifting (rates/growth). Watch if leaders can stabilize; otherwise trend risk.",
      meta: `Cyclicals down ${cyc.down}/${cyc.used || 0} • Financials down ${fin.down}/${fin.used || 0} • Leaders up ${leaders.up}/${leaders.used || 0}`
    };
  }

  if (b.used >= 10 && b.breadthUp >= 0.60 && leaders.up >= 1) {
    return {
      code: "recovery",
      badge: "🟩",
      label: "Recovery / Mean Reversion",
      toneClass: "evt-green",
      sub: "Buyers returning. In rebounds, leaders often confirm first, then cyclicals.",
      meta: `Breadth: ${b.up}/${b.used} up (${Math.round(b.breadthUp * 100)}%) • Leaders up ${leaders.up}/${leaders.used || 0}`
    };
  }

  return {
    code: "earnings",
    badge: "🟨",
    label: "Normal / Earnings-Driven",
    toneClass: "evt-yellow",
    sub: "No clear systemic pattern. Moves likely company-specific (earnings/news).",
    meta: `Breadth: ${b.up}/${b.used} up (${Math.round(b.breadthUp * 100)}%)`
  };
}

/* ============================================================
   LINK HELPERS
   ============================================================ */

function buildDefaultLinks(symbol) {
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

/* ============================================================
   OFF-CANVAS PANEL
   ============================================================ */

function ensurePanelOverlay() {
  let overlay = $("#panelOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "panelOverlay";
    overlay.className = "panelOverlay hidden";
    document.body.appendChild(overlay);
  }
  return overlay;
}

function openDesktopPanel() {
  const panel = $("#sidePanel");
  if (!panel) return;
  panel.classList.add("open");
  const overlay = ensurePanelOverlay();
  overlay.classList.remove("hidden");
  overlay.classList.add("show");
}

function closeDesktopPanel() {
  const panel = $("#sidePanel");
  if (panel) panel.classList.remove("open");
  const overlay = $("#panelOverlay");
  if (overlay) {
    overlay.classList.remove("show");
    overlay.classList.add("hidden");
  }
}

function showSideCard() {
  $("#sideEmpty")?.classList.add("hidden");
  $("#sideCard")?.classList.remove("hidden");
  if (!isMobile()) openDesktopPanel();
}

function hideSideCard() {
  $("#sideCard")?.classList.add("hidden");
  $("#sideEmpty")?.classList.remove("hidden");
  if (!isMobile()) closeDesktopPanel();
}

/* ============================================================
   MOBILE SHEET
   ============================================================ */

function openSheet(html) {
  const body = $("#sheetBody");
  const overlay = $("#sheetOverlay");
  const sheet = $("#sheet");
  if (!body || !overlay || !sheet) return;
  body.innerHTML = html;
  overlay.classList.remove("hidden");
  sheet.classList.remove("hidden");
}

function closeSheet() {
  $("#sheetOverlay")?.classList.add("hidden");
  $("#sheet")?.classList.add("hidden");
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

  const links = Array.from($("#cardLinks")?.querySelectorAll("a") || []).map((a) => ({
    label: a.textContent,
    href: a.href,
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
          ${links.map((l) => `<a class="linkItem" href="${l.href}" target="_blank" rel="noreferrer">${l.label}</a>`).join("")}
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
  const prev =
    Number(d?.previous_close) ||
    Number(d?.meta?.previous_close) ||
    Number(snap?._meta?.previous_close) ||
    NaN;

  $("#cardSym").textContent = s.symbol;
  $("#cardName").textContent = s.name || s.company || "—";
  $("#cardCat").textContent = s.category || s.sector || "—";
  $("#cardPrice").textContent = Number.isFinite(last) ? `$${fmtMoney(last)}` : "—";

  let chgText = "—";
  if (Number.isFinite(last) && Number.isFinite(prev) && prev !== 0) {
    const chg = last - prev;
    const pct = chg / prev;
    const sign = chg >= 0 ? "+" : "";
    chgText = `${sign}$${fmtMoney(chg)} (${sign}${fmtPct(pct)}) vs prev close`;
  }
  $("#cardChg").textContent = chgText;
  $("#cardBlurb").textContent = s.blurb || s.description || "—";

  const links = Array.isArray(s.links) && s.links.length
    ? s.links
    : buildDefaultLinks(s.symbol);

  renderLinks($("#cardLinks"), links);

  $("#cardPE").textContent = "—";
  $("#cardYield").textContent = "—";
  $("#cardEx").textContent = "—";
  $("#cardPay").textContent = "—";

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
        const annual = amt * 4;
        $("#cardYield").textContent = fmtPct(annual / last);
      } else if (Number.isFinite(amt)) {
        $("#cardYield").textContent = `$${fmtMoney(amt)} (per period)`;
      }
    }
  } catch {}

  try {
    const ern = await getEarnings(sym);
    const peFromApi = Number(ern?.pe ?? ern?.fundamentals?.pe);
    if (Number.isFinite(peFromApi)) $("#cardPE").textContent = peFromApi.toFixed(2);
  } catch {}

  showSideCard();

  if (isMobile()) {
    openSheet(cardHtmlFromDom());
    $("#sheetClose")?.addEventListener("click", closeSheet, { once: true });
  }
}

/* ============================================================
   TILE REFRESH
   ============================================================ */

async function refreshTiles(symbols, snap) {
  for (const s of symbols) {
    const d = snap?.[s.symbol] || {};
    const last = Number(d.last);
    const prev =
      Number(d?.previous_close) ||
      Number(d?.meta?.previous_close) ||
      NaN;

    const tileEl = document.querySelector(`.pTile[data-symbol="${s.symbol}"]`);
    const priceEl = $(`#pPrice-${s.symbol}`);
    const chgDollarEl = $(`#pChgDollar-${s.symbol}`);
    const chgPctEl = $(`#pChgPct-${s.symbol}`);
    const statusEl = $(`#pStatus-${s.symbol}`);

    if (priceEl) {
      priceEl.textContent = Number.isFinite(last) ? `$${fmtMoney(last)}` : "$—";
    }

    if (chgDollarEl && chgPctEl && tileEl) {
      tileEl.classList.remove("pos", "neg", "flat");

      if (Number.isFinite(last) && Number.isFinite(prev) && prev !== 0) {
        const chg = last - prev;
        const pct = chg / prev;
        const sign = chg >= 0 ? "+" : "";

        chgDollarEl.textContent = `${sign}$${fmtMoney(chg)}`;
        chgPctEl.textContent = `${sign}${fmtPct(pct)}`;

        chgDollarEl.classList.remove("pos", "neg");
        chgPctEl.classList.remove("pos", "neg");

        if (chg > 0) {
          tileEl.classList.add("pos");
          chgDollarEl.classList.add("pos");
          chgPctEl.classList.add("pos");
        } else if (chg < 0) {
          tileEl.classList.add("neg");
          chgDollarEl.classList.add("neg");
          chgPctEl.classList.add("neg");
        } else {
          tileEl.classList.add("flat");
        }
      } else {
        chgDollarEl.textContent = "—";
        chgPctEl.textContent = "—";
        chgDollarEl.classList.remove("pos", "neg");
        chgPctEl.classList.remove("pos", "neg");
        tileEl.classList.add("flat");
      }
    }

    const rthConfirmed = !!(d?.rth?.reversal?.confirmed);
    const ethConfirmed = !!(d?.eth?.reversal?.confirmed);
    const confirmed = rthConfirmed || ethConfirmed;

    if (statusEl) {
      statusEl.textContent = confirmed ? "Confirmed" : "Setup";
      statusEl.classList.toggle("confirmed", confirmed);
      statusEl.classList.toggle("forming", !confirmed);
    }
  }
}

/* ============================================================
   WIRING
   ============================================================ */

function wireCardClose() {
  $("#cardClose")?.addEventListener("click", () => {
    hideSideCard();
    closeSheet();
  });

  $("#sheetOverlay")?.addEventListener("click", closeSheet);

  const overlay = ensurePanelOverlay();
  overlay.addEventListener("click", () => {
    hideSideCard();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeSheet();
    hideSideCard();
  });
}

/* ============================================================
   MOBILE PERIODIC TABLE
   ============================================================ */

const COHORT_META = {
  liquidity_leader:    { label: "Liquidity", shortLabel: "LIQ", cls: "mob-c1", color: "#60a5fa", seqStep: 0 },
  reflex_bounce:       { label: "Reflexive", shortLabel: "REF", cls: "mob-c2", color: "#c084fc", seqStep: 1 },
  macro_sensitive:     { label: "Macro",     shortLabel: "MAC", cls: "mob-c3", color: "#34d399", seqStep: 2 },
  cyclical:            { label: "Cyclical",  shortLabel: "CYC", cls: "mob-c4", color: "#fb923c", seqStep: 3 },
  defensive:           { label: "Defensive", shortLabel: "DEF", cls: "mob-c5", color: "#f87171", seqStep: 4 },
};

const COHORT_ORDER_MOB = [
  "liquidity_leader",
  "reflex_bounce",
  "macro_sensitive",
  "cyclical",
  "defensive",
];

function toRoman(n) {
  const vals = [8, 7, 6, 5, 4, 3, 2, 1];
  const syms = ["VIII", "VII", "VI", "V", "IV", "III", "II", "I"];
  for (let i = 0; i < vals.length; i++) {
    if (n >= vals[i]) return syms[i];
  }
  return String(n);
}

function mobFmtPrice(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function mobFmtChg(chg) {
  if (!Number.isFinite(chg)) return "—";
  return `${chg >= 0 ? "+" : ""}${mobFmtPrice(chg)}`;
}

function mobFmtPct(pct) {
  if (!Number.isFinite(pct)) return "";
  return `${pct >= 0 ? "+" : ""}${(pct * 100).toFixed(2)}%`;
}

function getTileSignal(d) {
  if (!d) return "neutral";
  if (d?.rth?.reversal?.confirmed || d?.eth?.reversal?.confirmed) return "confirmed";
  const last = Number(d?.last);
  const prev = Number(d?.previous_close) || Number(d?.meta?.previous_close) || NaN;
  if (Number.isFinite(last) && Number.isFinite(prev) && prev !== 0) {
    return last < prev ? "down" : "forming";
  }
  return "neutral";
}

function injectMobileShell(symbols) {
  if ($("#mobView")) return;

  const legendHtml = COHORT_ORDER_MOB.map((k) => {
    const m = COHORT_META[k];
    return `<div class="mob-legend-item">
      <div class="mob-legend-swatch" style="background:${m.color}"></div>
      <span style="color:${m.color};font-size:8px;">${m.label}</span>
    </div>`;
  }).join("");

  const shell = document.createElement("div");
  shell.id = "mobView";
  shell.className = "mob-view";
  shell.innerHTML = `
    <div class="mob-screen active" id="mobScreenTable">
      <div class="mob-table-header">
        <div class="mob-header-row1">
          <span class="mob-brand">RISKXLABS / MCM</span>
          <div class="mob-regime-pill" id="mobRegimePill">
            <div class="mob-regime-dot"></div>
            <span id="mobRegimePillText">—</span>
          </div>
        </div>
        <div class="mob-main-title">PERIODIC TABLE<br>OF THE DOW</div>
        <div class="mob-legend">${legendHtml}</div>
      </div>

      <div class="mob-pt-container">
        <div class="mob-pt-master" id="mobPtMaster"></div>
      </div>

      <div class="mob-sequence-bar" id="mobSeqBar"></div>
      <div class="mob-seq-labels" id="mobSeqLabels"></div>

      <div class="mob-ticker">
        <div class="mob-ticker-inner" id="mobTickerInner"></div>
      </div>

      <div class="mob-regime-section">
        <div class="mob-event-card" id="mobEventCard">
          <div class="mob-event-card-top">
            <div class="mob-event-type-pill">
              <div class="mob-event-live-dot"></div>
              <span id="mobEventLabel">—</span>
            </div>
            <span class="mob-event-timestamp" id="mobEventAsof">—</span>
          </div>
          <div class="mob-breadth-readout">
            <div class="mob-breadout-stat">
              <span class="mob-breadout-val pos" id="mobBreadthUp">—</span>
              <span class="mob-breadout-label">Up</span>
            </div>
            <div class="mob-breadout-stat">
              <span class="mob-breadout-val pos" id="mobBreadthPct">—</span>
              <span class="mob-breadout-label">Breadth</span>
            </div>
            <div class="mob-breadout-stat">
              <span class="mob-breadout-val pos" id="mobBreadthLeaders">—</span>
              <span class="mob-breadout-label">Leaders</span>
            </div>
          </div>
          <div class="mob-event-name-row">
            <span class="mob-event-name-text" id="mobEventName">—</span>
            <span class="mob-event-sub" id="mobEventSub"></span>
          </div>
        </div>

        <div class="mob-regime-card">
          <div class="mob-regime-card-header">
            <span class="mob-regime-card-title">Market Regime</span>
            <span class="mob-regime-card-sub" id="mobRegimeSub">Current phase</span>
          </div>

          <!-- Animated spectrum bar -->
          <div class="mob-spectrum-wrap">

            <!-- Labels above -->
            <div class="mob-spectrum-labels">
              <span class="mob-spec-label-off">RISK-OFF</span>
              <span class="mob-spec-label-mid">TRANSITION</span>
              <span class="mob-spec-label-on">RISK-ON</span>
            </div>

            <!-- The bar itself -->
            <div class="mob-spectrum-track">
              <div class="mob-spectrum-gradient"></div>

              <!-- Directional momentum arrows — rendered by JS -->
              <div class="mob-spectrum-arrows" id="mobSpecArrows"></div>

              <!-- Moving dot indicator -->
              <div class="mob-spectrum-dot" id="mobSpecDot"></div>
            </div>

            <!-- Descriptors below -->
            <div class="mob-spectrum-descs">
              <span>Defensive<br>leadership</span>
              <span>Rotation /<br>caution</span>
              <span>Broad<br>participation</span>
            </div>

            <!-- Momentum label -->
            <div class="mob-spectrum-momentum" id="mobSpecMomentum"></div>

          </div>
        </div>
      </div>
    </div>

    <div class="mob-screen" id="mobScreenDetail">
      <div class="mob-det-header">
        <div class="mob-back-btn" id="mobBackBtn">‹ TABLE</div>
        <div class="mob-big-element" id="mobBigEl">
          <div class="mob-big-el-num" id="mobBigNum">—</div>
          <div class="mob-big-el-sym" id="mobBigSym">—</div>
          <div class="mob-big-el-name" id="mobBigName">—</div>
          <div class="mob-big-el-weight" id="mobBigWeight">—</div>
        </div>
        <div class="mob-det-company-name" id="mobDetName">—</div>
        <div class="mob-det-ceo" id="mobDetCat">—</div>
        <div class="mob-det-badge-row">
          <span class="mob-mbadge" id="mobDetBadge">—</span>
          <span class="mob-mbadge mob-mbadge-cohort" id="mobDetCohort">—</span>
        </div>
      </div>

      <div class="mob-el-data-table">
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">Price</div>
          <div class="mob-el-data-val" id="mobDetPrice">—</div>
          <div class="mob-el-data-sub" id="mobDetChange">—</div>
        </div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">Change %</div>
          <div class="mob-el-data-val" id="mobDetPct">—</div>
        </div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">Signal</div>
          <div class="mob-el-data-val" id="mobDetSignal">—</div>
        </div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">Cohort</div>
          <div class="mob-el-data-val" id="mobDetCohortVal">—</div>
        </div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">Category</div>
          <div class="mob-el-data-sub" id="mobDetCategory">—</div>
        </div>
      </div>

      <div class="mob-el-data-table" id="mobStatsSection">
        <div class="mob-stats-head">Quick Stats</div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">P/E Ratio</div>
          <div class="mob-el-data-val" id="mobStatPE">—</div>
        </div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">EPS (TTM)</div>
          <div class="mob-el-data-val" id="mobStatEPS">—</div>
        </div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">Mkt Cap</div>
          <div class="mob-el-data-val" id="mobStatMarketCap">—</div>
        </div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">52W High</div>
          <div class="mob-el-data-val" id="mobStat52High">—</div>
        </div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">52W Low</div>
          <div class="mob-el-data-val" id="mobStat52Low">—</div>
        </div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">Beta</div>
          <div class="mob-el-data-val" id="mobStatBeta">—</div>
        </div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">Revenue</div>
          <div class="mob-el-data-val" id="mobStatRevenue">—</div>
        </div>
        <div class="mob-el-data-row">
          <div class="mob-el-data-label">Div Yield</div>
          <div class="mob-el-data-val" id="mobStatYield">—</div>
        </div>
      </div>

      <div class="mob-det-about">
        <div class="mob-det-about-title">About</div>
        <div class="mob-det-about-text" id="mobDetAbout">—</div>
      </div>

      <div class="mob-signal-box" id="mobSignalBox">
        <div class="mob-signal-title" id="mobSignalTitle">MCM Signal</div>
        <div class="mob-signal-text" id="mobSignalText">—</div>
      </div>

      <div class="mob-det-links" id="mobDetLinks">
        <div class="mob-det-links-title">Links</div>
        <div class="mob-det-links-list" id="mobDetLinksList"></div>
      </div>
    </div>

    <div class="mob-tab-bar">
      <div class="mob-tab mob-tab-active" data-tab="table">
        <div class="mob-tab-icon">⊞</div>
        <div class="mob-tab-lbl">TABLE</div>
      </div>
      <div class="mob-tab" data-tab="events">
        <div class="mob-tab-icon">⚡</div>
        <div class="mob-tab-lbl">EVENTS</div>
      </div>
      <div class="mob-tab" data-tab="perf">
        <div class="mob-tab-icon">▲</div>
        <div class="mob-tab-lbl">PERF</div>
      </div>
      <div class="mob-tab" data-tab="play">
        <div class="mob-tab-icon">📋</div>
        <div class="mob-tab-lbl">PLAYBOOK</div>
      </div>
    </div>
  `;

  document.body.insertBefore(shell, document.body.firstChild);

  // Tab bar navigation
  shell.querySelectorAll(".mob-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const t = tab.getAttribute("data-tab");
      if (t === "table") {
        mobShowScreen("table");
      } else if (t === "events") {
        window.location.href = "/events.html";
      } else if (t === "perf") {
        window.location.href = "/performance.html";
      } else if (t === "play") {
        window.location.href = "/faq.html";
      }
    });
  });

  // Back button
  shell.querySelector("#mobBackBtn").addEventListener("click", () => {
    mobShowScreen("table");
  });
}

function mobShowScreen(name) {
  document.querySelectorAll(".mob-screen").forEach((s) => s.classList.remove("active"));
  const target = name === "detail" ? $("#mobScreenDetail") : $("#mobScreenTable");
  if (target) { target.classList.add("active"); target.scrollTop = 0; }

  document.querySelectorAll(".mob-tab").forEach((t) => {
    t.classList.toggle("mob-tab-active", t.getAttribute("data-tab") === name);
  });
}

function mobRenderTable(symbols, snap) {
  const master = $("#mobPtMaster");
  if (!master) return;

  const grouped = {};
  for (const s of symbols) {
    const k = s.cohort || "other";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(s);
  }

  const maxCols = Math.max(...COHORT_ORDER_MOB.map((k) => (grouped[k] || []).length));
  const colCount = Math.min(maxCols, 8);

  // Only render column headers up to the actual data width
  let html = `<div class="mob-col-hdr mob-col-hdr-empty"></div>`;
  for (let i = 1; i <= colCount; i++) {
    // Check if any row actually has data in this column
    const hasData = COHORT_ORDER_MOB.some((k) => (grouped[k] || []).length >= i);
    if (hasData) {
      html += `<div class="mob-col-hdr">${toRoman(i)}</div>`;
    } else {
      html += `<div class="mob-col-hdr" style="opacity:0;pointer-events:none;"></div>`;
    }
  }

  let atomicNum = 1;

  for (const cohortKey of COHORT_ORDER_MOB) {
    const list = grouped[cohortKey] || [];
    if (!list.length) continue;
    const meta = COHORT_META[cohortKey] || { label: cohortKey, cls: "mob-c1", color: "#888", shortLabel: "—" };

    // Split into chunks of colCount so long cohorts wrap cleanly
    const chunks = [];
    for (let i = 0; i < list.length; i += colCount) {
      chunks.push(list.slice(i, i + colCount));
    }

    chunks.forEach((chunk, chunkIdx) => {
      // Row label — only show on first chunk of each cohort
      if (chunkIdx === 0) {
        html += `
          <div class="mob-row-label" style="position:relative;">
            <span class="mob-row-label-name" style="color:${meta.color}">${meta.shortLabel}</span>
            <div style="position:absolute;right:0;top:0;bottom:0;width:2px;background:${meta.color};opacity:.35;border-radius:1px;"></div>
          </div>
        `;
      } else {
        // Continuation row — empty label cell with color bar
        html += `
          <div class="mob-row-label" style="position:relative;">
            <div style="position:absolute;right:0;top:0;bottom:0;width:2px;background:${meta.color};opacity:.35;border-radius:1px;"></div>
          </div>
        `;
      }

      chunk.forEach((s) => {
        const d = snap?.[s.symbol] || {};
        const last = Number(d.last);
        const prev = Number(d?.previous_close) || Number(d?.meta?.previous_close) || NaN;
        const hasData = Number.isFinite(last) && Number.isFinite(prev) && prev !== 0;
        const chg = hasData ? last - prev : NaN;
        const isPos = hasData && chg >= 0;
        const isNeg = hasData && chg < 0;
        const signal = getTileSignal(d);
        const signalCls = signal === "confirmed" ? "mob-el-confirmed" : signal === "down" ? "mob-el-down" : signal === "forming" ? "mob-el-forming" : "";
        const dirCls = isPos ? "pos" : isNeg ? "neg" : "";

        html += `
          <div class="mob-el ${meta.cls} ${signalCls}" data-symbol="${s.symbol}" data-atomic="${atomicNum}">
            <div class="mob-el-num">${atomicNum}</div>
            <div class="mob-el-price ${dirCls}">${hasData ? mobFmtPrice(last) : "—"}</div>
            <div class="mob-el-sym">${s.symbol}</div>
            <div class="mob-el-change ${dirCls}">${hasData ? mobFmtChg(chg) : "—"}</div>
          </div>
        `;
        atomicNum++;
      });

      // Fill remainder of row with empty cells
      const emptyCells = colCount - chunk.length;
      for (let e = 0; e < emptyCells; e++) {
        html += `<div class="mob-el mob-el-empty"></div>`;
      }
    });
  }

  master.style.gridTemplateColumns = `52px repeat(${colCount}, minmax(0, 1fr))`;
  master.style.maxWidth = "100%";
  master.innerHTML = html;

  master.querySelectorAll(".mob-el[data-symbol]").forEach((el) => {
    el.addEventListener("click", () => mobOpenDetail(el.getAttribute("data-symbol"), snap));
  });
}

function mobRenderSequence(evt) {
  const bar = $("#mobSeqBar");
  const labels = $("#mobSeqLabels");
  if (!bar || !labels) return;

  const stepMap = { panic: -1, recovery: 2, policy: 1, macro: 1, earnings: 0 };
  const activeStep = stepMap[evt?.code] ?? 0;

  const steps = ["Liquidity", "Reflexive", "Macro", "Defensive"];
  let barHtml = "";
  let labelHtml = "";

  steps.forEach((label, i) => {
    const state = i < activeStep ? "done" : i === activeStep ? "active" : "wait";
    barHtml += `<div class="mob-seq-step"><div class="mob-seq-fill mob-seq-${state}"></div></div>`;
    if (i < steps.length - 1) barHtml += `<div class="mob-seq-arrow mob-seq-${state}"></div>`;
    labelHtml += `<div class="mob-seq-label mob-seq-${state}">${label}</div>`;
  });

  bar.innerHTML = barHtml;
  labels.innerHTML = labelHtml;
}

function mobRenderTicker(symbols, snap) {
  const inner = $("#mobTickerInner");
  if (!inner) return;

  const items = symbols.map((s) => {
    const d = snap?.[s.symbol] || {};
    const last = Number(d.last);
    const prev = Number(d?.previous_close) || Number(d?.meta?.previous_close) || NaN;
    if (!Number.isFinite(last)) return null;
    const chg = Number.isFinite(prev) && prev !== 0 ? (last - prev) / prev : NaN;
    const isPos = Number.isFinite(chg) && chg >= 0;
    const pctStr = Number.isFinite(chg) ? `${isPos ? "+" : ""}${(chg * 100).toFixed(2)}%` : "—";
    return `<div class="mob-t-item"><span class="mob-t-sym">${s.symbol}</span> ${mobFmtPrice(last)} <span class="${isPos ? "mob-t-pos" : "mob-t-neg"}">${pctStr}</span></div>`;
  }).filter(Boolean);

  const markup = items.join("");
  inner.innerHTML = markup + markup;
}

function mobRenderEventCard(evt, snap, symbols) {
  if (!evt) return;

  const pillEl = $("#mobRegimePill");
  const pillText = $("#mobRegimePillText");
  if (pillText) pillText.textContent = evt.label || "—";
  if (pillEl) {
    pillEl.className = "mob-regime-pill";
    if (evt.toneClass === "evt-green") pillEl.classList.add("mob-pill-green");
    else if (evt.toneClass === "evt-red") pillEl.classList.add("mob-pill-red");
    else if (evt.toneClass === "evt-orange" || evt.toneClass === "evt-yellow") pillEl.classList.add("mob-pill-yellow");
    else pillEl.classList.add("mob-pill-blue");
  }

  const el = (id) => $(id);
  if (el("#mobEventLabel")) el("#mobEventLabel").textContent = evt.label || "—";
  if (el("#mobEventAsof")) el("#mobEventAsof").textContent = snap?._meta?.asof_local || "—";
  if (el("#mobEventName")) el("#mobEventName").textContent = evt.label || "—";
  if (el("#mobEventSub")) {
    el("#mobEventSub").textContent = "MCM active ›";
    el("#mobEventSub").style.color = evt.toneClass === "evt-green" ? "#22c55e" : evt.toneClass === "evt-red" ? "#ef4444" : "#eab308";
  }

  // Breadth
  const LEADERS = ["MSFT", "AAPL", "NVDA", "V"];
  let up = 0, total = 0, leadersUp = 0;
  for (const s of symbols) {
    const d = snap?.[s.symbol];
    if (!d) continue;
    const last = Number(d.last);
    const prev = Number(d?.previous_close) || Number(d?.meta?.previous_close) || NaN;
    if (!Number.isFinite(last) || !Number.isFinite(prev) || prev === 0) continue;
    total++;
    if (last >= prev) up++;
  }
  for (const sym of LEADERS) {
    const d = snap?.[sym];
    if (!d) continue;
    const last = Number(d.last);
    const prev = Number(d?.previous_close) || Number(d?.meta?.previous_close) || NaN;
    if (Number.isFinite(last) && Number.isFinite(prev) && prev !== 0 && last >= prev) leadersUp++;
  }
  const pct = total ? Math.round((up / total) * 100) : 0;

  const upEl = $("#mobBreadthUp");
  const pctEl = $("#mobBreadthPct");
  const leadEl = $("#mobBreadthLeaders");
  if (upEl) { upEl.textContent = total ? `${up}/${total}` : "—"; upEl.className = `mob-breadout-val ${up >= total / 2 ? "pos" : "neg"}`; }
  if (pctEl) { pctEl.textContent = total ? `${pct}%` : "—"; pctEl.className = `mob-breadout-val ${pct >= 50 ? "pos" : "neg"}`; }
  if (leadEl) { leadEl.textContent = `${leadersUp}/${LEADERS.length}`; leadEl.className = `mob-breadout-val ${leadersUp >= 2 ? "pos" : "neg"}`; }

  // Animated spectrum bar
  updateSpectrumBar(evt, snap, symbols);
}

function mobOpenDetail(sym, snap) {
  const currentSnap = snap || window.__mobSnap;
  const symbolsBySym = window.__mobSymbolsBySym || {};
  const s = symbolsBySym[sym];
  const d = currentSnap?.[sym] || {};

  const last = Number(d.last);
  const prev = Number(d?.previous_close) || Number(d?.meta?.previous_close) || NaN;
  const hasData = Number.isFinite(last) && Number.isFinite(prev) && prev !== 0;
  const chg = hasData ? last - prev : NaN;
  const pct = hasData ? chg / prev : NaN;
  const isPos = hasData && chg >= 0;
  const signal = getTileSignal(d);
  const cohortKey = s?.cohort || "other";
  const meta = COHORT_META[cohortKey] || { label: cohortKey, color: "#888", cls: "mob-c1" };

  const tileEl = document.querySelector(`.mob-el[data-symbol="${sym}"]`);
  const atomicNum = tileEl?.getAttribute("data-atomic") || "—";

  const bigEl = $("#mobBigEl");
  if (bigEl) {
    bigEl.className = `mob-big-element ${meta.cls}`;
    bigEl.style.borderColor = signal === "confirmed" ? "rgba(34,197,94,.5)" : signal === "down" ? "rgba(239,68,68,.4)" : "rgba(234,179,8,.45)";
  }

  const setText = (id, val) => { const el = $(`#${id}`); if (el) el.textContent = val; };

  setText("mobBigNum", atomicNum);
  setText("mobBigSym", sym);
  const symEl = $("#mobBigSym");
  if (symEl) symEl.style.color = signal === "confirmed" ? "#86efac" : signal === "down" ? "#fca5a5" : "#fde68a";
  setText("mobBigName", (s?.name || sym).split(" ")[0]);
  setText("mobBigWeight", hasData ? mobFmtPrice(last) : "—");
  setText("mobDetName", s?.name || sym);
  setText("mobDetCat", s?.category || "—");

  const badge = $("#mobDetBadge");
  if (badge) {
    badge.className = `mob-mbadge mob-mbadge-${signal}`;
    badge.textContent = signal === "confirmed" ? "Confirmed" : signal === "down" ? "No Confirm" : "Setup Forming";
  }

  const cohortBadge = $("#mobDetCohort");
  if (cohortBadge) {
    cohortBadge.textContent = meta.label;
    cohortBadge.style.color = meta.color;
    cohortBadge.style.borderColor = meta.color + "44";
    cohortBadge.style.background = meta.color + "18";
  }

  setText("mobDetPrice", hasData ? `$${mobFmtPrice(last)}` : "—");

  const chgEl = $("#mobDetChange");
  if (chgEl) { chgEl.textContent = hasData ? mobFmtChg(chg) : "—"; chgEl.className = `mob-el-data-sub ${isPos ? "pos" : "neg"}`; }

  const pctEl = $("#mobDetPct");
  if (pctEl) { pctEl.textContent = hasData ? mobFmtPct(pct) : "—"; pctEl.className = `mob-el-data-val ${isPos ? "pos" : "neg"}`; }

  const cohortValEl = $("#mobDetCohortVal");
  if (cohortValEl) { cohortValEl.textContent = meta.label; cohortValEl.style.color = meta.color; }

  setText("mobDetCategory", s?.category || "—");

  const signalEl = $("#mobDetSignal");
  if (signalEl) {
    signalEl.textContent = signal === "confirmed" ? "⚡ RTH Confirmed" : signal === "down" ? "⚠ No Confirmation" : "◎ Setup Forming";
    signalEl.className = `mob-el-data-val mob-signal-${signal}`;
  }

  // Placeholder while async loads
  setText("mobDetAbout", "Loading…");
  updateStatRow("mobStatPE",        "…");
  updateStatRow("mobStatEPS",       "…");
  updateStatRow("mobStatMarketCap", "…");
  updateStatRow("mobStat52High",    "…");
  updateStatRow("mobStat52Low",     "…");
  updateStatRow("mobStatBeta",      "…");
  updateStatRow("mobStatRevenue",   "…");
  updateStatRow("mobStatYield",     "…");

  const sigBox = $("#mobSignalBox");
  if (sigBox) sigBox.className = `mob-signal-box mob-signal-box-${signal}`;
  setText("mobSignalTitle",
    signal === "confirmed" ? "⚡ MCM Signal — Confirmed" :
    signal === "down"      ? "⚠ MCM Signal — No Confirmation" :
                             "◎ MCM Signal — Setup Forming"
  );
  const sigText = hasData
    ? `${sym} is ${chg >= 0 ? "up" : "down"} ${mobFmtPct(pct)}${
        signal === "confirmed" ? " with RTH reversal confirmed. " + meta.label + " cohort participation confirmed."
      : signal === "down"     ? ". No reversal confirmation yet. Watch for reclaim of intraday baseline."
      :                         ". Setup forming — reversal not yet confirmed in RTH session."}`
    : `No price data available for ${sym} yet.`;
  setText("mobSignalText", sigText);

  // Populate links
  const linksList = $("#mobDetLinksList");
  if (linksList) {
    const links = Array.isArray(s?.links) && s.links.length
      ? s.links
      : buildDefaultLinks(sym);
    linksList.innerHTML = links.map((l) =>
      `<a class="mob-det-link-item" href="${l.href}" target="_blank" rel="noreferrer">${l.label}</a>`
    ).join("");
  }

  // After async stats load, add website link if available
  // (handled in the async block below)

  // Show detail screen immediately
  mobShowScreen("detail");

  // Async: fetch fundamentals (description comes from TwelveData profile)
  Promise.allSettled([
    getFundamentals(sym),
  ]).then(([statsResult]) => {

    // Fundamentals + description
    if (statsResult.status === "fulfilled") {
      const f = statsResult.value;

      // Use TwelveData description — no OpenAI needed
      if (f.description) {
        setText("mobDetAbout", f.description);
      } else {
        setText("mobDetAbout", s?.blurb || s?.category || "—");
      }

      // Add website link if available from TwelveData
      if (f.website) {
        const linksList = $("#mobDetLinksList");
        if (linksList) {
          const existingLinks = Array.isArray(s?.links) && s.links.length
            ? s.links
            : buildDefaultLinks(sym);
          // Prepend website link if not already present
          const hasWebsite = existingLinks.some(l => l.href === f.website);
          const allLinks = hasWebsite ? existingLinks : [
            { label: `${s?.name || sym} Website`, href: f.website },
            ...existingLinks,
          ];
          linksList.innerHTML = allLinks.map((l) =>
            `<a class="mob-det-link-item" href="${l.href}" target="_blank" rel="noreferrer">${l.label}</a>`
          ).join("");
        }
      }

      const fmtLarge = (n) => {
        if (!Number.isFinite(n)) return "—";
        if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
        if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
        if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
        return `$${n.toLocaleString()}`;
      };

      const fmtVal = (n, prefix = "", suffix = "") =>
        Number.isFinite(n) ? `${prefix}${n.toFixed(2)}${suffix}` : "—";

      updateStatRow("mobStatPE",        fmtVal(f.pe));
      updateStatRow("mobStatEPS",       fmtVal(f.eps, "$"));
      updateStatRow("mobStatMarketCap", fmtLarge(f.market_cap));
      updateStatRow("mobStat52High",    fmtVal(f.week_52_high, "$"));
      updateStatRow("mobStat52Low",     fmtVal(f.week_52_low,  "$"));
      updateStatRow("mobStatBeta",      fmtVal(f.beta));
      updateStatRow("mobStatRevenue",   fmtLarge(f.revenue));
      updateStatRow("mobStatYield",     Number.isFinite(f.dividend_yield)
        ? fmtVal(f.dividend_yield * 100, "", "%") : "—");
    } else {
      setText("mobDetAbout", s?.blurb || s?.category || "—");
    }
  });
}

function updateStatRow(id, val) {
  const el = $(`#${id}`);
  if (el) el.textContent = val;
}

function updateSpectrumBar(evt, snap, symbols) {
  const dot = $("#mobSpecDot");
  const arrows = $("#mobSpecArrows");
  const momentum = $("#mobSpecMomentum");
  const sub = $("#mobRegimeSub");
  if (!dot || !arrows) return;

  // Dot position as % across the bar
  const positions = {
    panic:    8,
    policy:   20,
    macro:    38,
    earnings: 50,
    recovery: 82,
  };
  const pos = positions[evt?.code] ?? 50;

  // Set dot position with smooth transition
  dot.style.left = `calc(${pos}% - 9px)`;

  // Determine dot color based on position
  if (pos <= 30) {
    dot.className = "mob-spectrum-dot mob-spec-dot-off";
  } else if (pos <= 60) {
    dot.className = "mob-spectrum-dot mob-spec-dot-trans";
  } else {
    dot.className = "mob-spectrum-dot mob-spec-dot-on";
  }

  // Compute momentum direction from breadth
  const LEADERS = ["MSFT", "AAPL", "NVDA", "V"];
  let up = 0, total = 0, leadersUp = 0;
  for (const s of symbols) {
    const d = snap?.[s.symbol];
    if (!d) continue;
    const last = Number(d.last);
    const prev = Number(d?.previous_close) || Number(d?.meta?.previous_close) || NaN;
    if (!Number.isFinite(last) || !Number.isFinite(prev) || prev === 0) continue;
    total++;
    if (last >= prev) up++;
  }
  for (const sym of LEADERS) {
    const d = snap?.[sym];
    if (!d) continue;
    const last = Number(d.last);
    const prev = Number(d?.previous_close) || Number(d?.meta?.previous_close) || NaN;
    if (Number.isFinite(last) && Number.isFinite(prev) && prev !== 0 && last >= prev) leadersUp++;
  }

  const breadthPct = total ? up / total : 0;
  const leadersStrong = leadersUp >= 2;

  // Determine momentum: risk-on, risk-off, or neutral
  let direction = "neutral";
  if (breadthPct >= 0.60 && leadersStrong) direction = "risk-on";
  else if (breadthPct <= 0.35 && leadersUp <= 1) direction = "risk-off";

  // Build animated arrows
  const arrowCount = 5;
  let arrowHtml = "";
  let momentumText = "";

  if (direction === "risk-on") {
    for (let i = 0; i < arrowCount; i++) {
      arrowHtml += `<span class="mob-spec-arrow mob-spec-arrow-on" style="animation-delay:${i * 0.22}s">›</span>`;
    }
    momentumText = "▲ Momentum building toward Risk-On";
    if (momentum) { momentum.textContent = momentumText; momentum.className = "mob-spectrum-momentum mob-spec-mom-on"; }
  } else if (direction === "risk-off") {
    for (let i = arrowCount - 1; i >= 0; i--) {
      arrowHtml += `<span class="mob-spec-arrow mob-spec-arrow-off" style="animation-delay:${(arrowCount - 1 - i) * 0.22}s">‹</span>`;
    }
    momentumText = "▼ Momentum shifting toward Risk-Off";
    if (momentum) { momentum.textContent = momentumText; momentum.className = "mob-spectrum-momentum mob-spec-mom-off"; }
  } else {
    arrowHtml = "";
    momentumText = "◆ Mixed signals — Transition zone";
    if (momentum) { momentum.textContent = momentumText; momentum.className = "mob-spectrum-momentum mob-spec-mom-neu"; }
  }

  arrows.innerHTML = arrowHtml;

  // Update sub label
  if (sub) {
    const labels = {
      panic:    "Panic / Liquidation — defensive leadership",
      policy:   "Risk-Off — rotation into safety",
      macro:    "Macro repricing — transition",
      earnings: "Normal / Earnings-driven — transition",
      recovery: "Recovery — broad participation building",
    };
    sub.textContent = labels[evt?.code] || "Current phase";
  }

  // Focus signal — highlight the cohort to watch right now
  updateCohortFocus(evt);
}

function updateCohortFocus(evt) {
  // Map event code to the cohort that should be in focus
  // Based on MCM recovery sequence theory:
  // panic    → watch Defensive (safe haven leadership)
  // policy   → watch Liquidity (first movers on relief)
  // macro    → watch Macro-Sensitive (financials, housing)
  // earnings → watch Reflexive (growth names, high beta)
  // recovery → watch Cyclical (full risk-on confirmation)
  const focusMap = {
    panic:    { cohort: "defensive", cls: "mob-row-focus-def", label: "SAFE HAVEN" },
    policy:   { cohort: "liquidity_leader", cls: "mob-row-focus-liq", label: "WATCH" },
    macro:    { cohort: "macro_sensitive",  cls: "mob-row-focus-mac", label: "WATCH" },
    earnings: { cohort: "reflex_bounce",    cls: "mob-row-focus-ref", label: "WATCH" },
    recovery: { cohort: "cyclical",         cls: "mob-row-focus-cyc", label: "WATCH" },
  };

  const focus = focusMap[evt?.code] || null;

  // Clear all existing focus classes
  const allFocusClasses = [
    "mob-row-focus",
    "mob-row-focus-liq",
    "mob-row-focus-ref",
    "mob-row-focus-mac",
    "mob-row-focus-cyc",
    "mob-row-focus-def",
  ];

  document.querySelectorAll(".mob-row-label").forEach((el) => {
    allFocusClasses.forEach((cls) => el.classList.remove(cls));
    // Remove any focus badge
    el.querySelector(".mob-row-focus-badge")?.remove();
  });

  if (!focus) return;

  // Find row labels matching the focus cohort and apply focus
  // Row labels are adjacent to their cohort tiles — find by position in grid
  const master = $("#mobPtMaster");
  if (!master) return;

  // Get all row labels and find which ones correspond to the focus cohort
  // We identify by checking the next sibling tile's data-symbol cohort
  const rowLabels = master.querySelectorAll(".mob-row-label");
  rowLabels.forEach((label) => {
    // Find the first tile sibling after this row label
    let sibling = label.nextElementSibling;
    while (sibling && sibling.classList.contains("mob-el-empty")) {
      sibling = sibling.nextElementSibling;
    }
    if (!sibling) return;

    const sym = sibling.getAttribute("data-symbol");
    if (!sym) return;

    const symbolsBySym = window.__mobSymbolsBySym || {};
    const s = symbolsBySym[sym];
    if (!s) return;

    if (s.cohort === focus.cohort) {
      label.classList.add("mob-row-focus", focus.cls);

      // Add WATCH badge to the right of the row
      // Find the last non-empty sibling tile in this row
      // and append the badge after it as a separate grid element
      const badge = document.createElement("div");
      badge.className = "mob-row-focus-badge-right";
      badge.innerHTML = `<span>${focus.label}</span>`;
      // Place badge at the end of the row label itself but styled to appear on right
      label.appendChild(badge);
    }
  });
}

function refreshMobileView(symbols, snap, evt) {
  window.__mobSnap = snap;
  mobRenderTable(symbols, snap);
  mobRenderSequence(evt);
  mobRenderTicker(symbols, snap);
  mobRenderEventCard(evt, snap, symbols);
}

/* ============================================================
   BOOT
   ============================================================ */

async function boot() {
  const cfg = await import("./config.js");
  const SYMBOLS = cfg.DOW30 || cfg.SYMBOLS || cfg.symbols || [];
  const UI_REFRESH_MS = Number(cfg.UI_REFRESH_MS) || 60_000;

  const symbols = SYMBOLS.map((s) => ({
    symbol: String(s.symbol || "").toUpperCase(),
    name: s.name || s.company || "",
    category: s.category || s.sector || "",
    cohort: s.cohort || s.cohort_key || s.group,
    blurb: s.blurb || s.description || "",
    links: s.links || null,
  })).filter((s) => s.symbol);

  const symbolsBySym = Object.fromEntries(symbols.map((s) => [s.symbol, s]));

  // Store for mobile detail screen access
  window.__mobSymbolsBySym = symbolsBySym;

  // Desktop table
  renderCohorts($("#periodicRow"), symbols);
  wireCardClose();

  // Always inject mobile shell — it is now the primary UI
  injectMobileShell(symbols);

  try {
    const active = await getActiveEvent();
    $("#homeEventLine").textContent = active?.title ? `Active event: ${active.title}` : "Active event: —";
  } catch {
    $("#homeEventLine").textContent = "Active event: —";
  }

  async function refresh() {
    let snap = null;

    try {
      snap = await getSnapshot(symbols.map((s) => s.symbol));
    } catch {
      setRegimeBanner({ title: "MARKET REGIME: —", sub: "Unable to load snapshot.", meta: "—", toneClass: "evt-neutral" });
      return;
    }

    setAsOfLabels(snap);
    await refreshDjiaQuote();
    await refreshMarketNews();

    const evt = detectEvent(symbols, snap);

    setRegimeBanner({
      title: `${evt.badge} EVENT: ${evt.label}`,
      sub: evt.sub,
      meta: evt.meta,
      toneClass: evt.toneClass,
    });

    await refreshTiles(symbols, snap);

    // Always refresh mobile view — it is the primary UI
    if (!$("#mobView")) injectMobileShell(symbols);
    refreshMobileView(symbols, snap, evt);

    document.querySelectorAll(".pTile").forEach((btn) => {
      if (btn.dataset.wired === "1") return;
      btn.dataset.wired = "1";
      btn.addEventListener("click", async () => {
        const sym = btn.getAttribute("data-symbol");
        await populateCompanyCard(symbolsBySym, snap, sym);
      });
    });
  }

  await refresh();
  setInterval(() => refresh().catch(() => {}), UI_REFRESH_MS);
}

boot();
