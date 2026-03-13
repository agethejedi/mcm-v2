// src/periodic.js
import { getSnapshot, getActiveEvent, getDividends, getEarnings } from "./api.js";

const $ = (sel) => document.querySelector(sel);
const DJIA_CANDIDATES = [".DJI", "^DJI", "DJI", "DIA"];

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
  return window.matchMedia("(max-width: 900px)").matches;
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
  const prev =
    Number(d?.previous_close) ||
    Number(d?.meta?.previous_close) ||
    NaN;

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

      // guard against bogus non-index readings
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
    track.innerHTML = `
      <a class="newsItem muted" href="#" onclick="return false;">
        No market headlines available.
      </a>
    `;
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

  // duplicate for seamless ticker effect
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
}

function closeDesktopPanel() {
  const panel = $("#sidePanel");
  if (panel) panel.classList.remove("open");
  const overlay = $("#panelOverlay");
  if (overlay) overlay.classList.add("hidden");
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

  renderCohorts($("#periodicRow"), symbols);
  wireCardClose();

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
      setRegimeBanner({
        title: "MARKET REGIME: —",
        sub: "Unable to load snapshot.",
        meta: "—",
        toneClass: "evt-neutral",
      });
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
