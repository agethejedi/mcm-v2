import { DOW30 } from "./config.js";
import { getSnapshot, getActiveEvent } from "./api.js";

const $ = (sel) => document.querySelector(sel);

const ONBOARD_KEY = "mcm_onboarded_v2";

function groupByCohort(symbols) {
  const order = [
    { key: "liquidity_leader", label: "Liquidity Leaders" },
    { key: "reflex_bounce", label: "Reflex / Growth" },
    { key: "macro_sensitive", label: "Macro-Sensitive" },
    { key: "cyclical", label: "Cyclicals / Industrials" },
    { key: "defensive", label: "Defensive / Yield" },
  ];

  const buckets = new Map(order.map(o => [o.key, { ...o, items: [] }]));
  for (const s of symbols) {
    const k = buckets.has(s.cohort) ? s.cohort : "macro_sensitive";
    buckets.get(k).items.push(s);
  }
  return order.map(o => buckets.get(o.key)).filter(b => b.items.length);
}

function fmt(n) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function fmtPct(p) {
  if (!Number.isFinite(p)) return "—";
  return (p * 100).toFixed(2) + "%";
}

function tileHTML(s) {
  return `
    <button class="ptile" id="ptile-${s.symbol}" data-sym="${s.symbol}" type="button">
      <div class="ptop">
        <div class="psym">${s.symbol}</div>
        <div class="pprice" id="pprice-${s.symbol}">—</div>
      </div>
      <div class="pbot">
        <div class="pname">${s.name}</div>
        <div class="pchg" id="pchg-${s.symbol}">—</div>
      </div>
    </button>
  `;
}

function cohortColumnHTML(bucket) {
  return `
    <section class="cohortCol">
      <div class="cohortHead">
        <div class="cohortTitle">${bucket.label}</div>
        <div class="cohortSub">${bucket.items.length} names</div>
      </div>
      <div class="cohortGrid">
        ${bucket.items.map(tileHTML).join("")}
      </div>
    </section>
  `;
}

const FUNDAMENTALS = {
  // Minimal blurbs + links (v2 can swap to an API)
  AAPL: { blurb: "Consumer devices + services ecosystem.", links: [{ label: "Investor Relations", url: "https://investor.apple.com/" }] },
  MSFT: { blurb: "Cloud, enterprise software, and AI infrastructure.", links: [{ label: "Investor Relations", url: "https://www.microsoft.com/en-us/Investor" }] },
  IBM: { blurb: "Enterprise technology and hybrid cloud services.", links: [{ label: "Investor Relations", url: "https://www.ibm.com/investor" }] },
};

function getFund(sym) {
  return FUNDAMENTALS[sym] || {
    blurb: "Company card will expand in v2 with fundamentals, filings, and earnings history.",
    links: [{ label: "Search Filings", url: `https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(sym)}` }]
  };
}

function openCard({ sym, name, category, price, chgText }) {
  const fund = getFund(sym);

  // Desktop side panel
  $("#sideEmpty")?.classList.add("hidden");
  const card = $("#sideCard");
  card?.classList.remove("hidden");

  $("#cardSym").textContent = sym;
  $("#cardName").textContent = name;
  $("#cardCat").textContent = category;
  $("#cardPrice").textContent = price;
  $("#cardChg").textContent = chgText;
  $("#cardBlurb").textContent = fund.blurb;

  // placeholders
  $("#cardPE").textContent = "—";
  $("#cardYield").textContent = "—";
  $("#cardEx").textContent = "—";
  $("#cardPay").textContent = "—";

  const links = $("#cardLinks");
  links.innerHTML = "";
  for (const l of (fund.links || [])) {
    const a = document.createElement("a");
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = l.label;
    links.appendChild(a);
  }

  // Mobile bottom sheet
  const sheet = $("#sheet");
  const overlay = $("#sheetOverlay");
  const sheetBody = $("#sheetBody");
  const isMobile = window.matchMedia("(max-width: 980px)").matches;
  if (isMobile) {
    sheetBody.innerHTML = `
      <div class="sheetHeader">
        <div>
          <div class="sideSym">${sym}</div>
          <div class="sideName">${name}</div>
          <div class="sideCat">${category}</div>
        </div>
        <button class="xbtn" id="sheetClose">×</button>
      </div>
      <div class="sidePrice">
        <div class="priceBig">${price}</div>
        <div class="priceSub">${chgText}</div>
      </div>
      <div class="sideSection">
        <div class="sideSectionTitle">What the company does</div>
        <div class="sideText">${fund.blurb}</div>
      </div>
      <div class="sideSection">
        <div class="sideSectionTitle">Links</div>
        <div class="linkList">${(fund.links||[]).map(l => `<a target="_blank" rel="noreferrer" href="${l.url}">${l.label}</a>`).join("")}</div>
      </div>
      <div class="sideHint muted">Not investment advice. Educational tool.</div>
    `;

    overlay.classList.remove("hidden");
    sheet.classList.remove("hidden");

    const close = () => {
      overlay.classList.add("hidden");
      sheet.classList.add("hidden");
    };
    overlay.onclick = close;
    sheetBody.querySelector("#sheetClose").onclick = close;
  }
}

function wireClicks() {
  for (const s of DOW30) {
    const el = document.getElementById(`ptile-${s.symbol}`);
    if (!el) continue;
    el.addEventListener("click", () => {
      const price = document.getElementById(`pprice-${s.symbol}`)?.textContent || "—";
      const chgText = document.getElementById(`pchg-${s.symbol}`)?.textContent || "—";
      openCard({ sym: s.symbol, name: s.name, category: s.category, price, chgText });
    });
  }

  $("#cardClose")?.addEventListener("click", () => {
    $("#sideCard")?.classList.add("hidden");
    $("#sideEmpty")?.classList.remove("hidden");
  });
}

function maybeShowOnboarding() {
  if (localStorage.getItem(ONBOARD_KEY) === "true") return;
  const overlay = $("#onboardOverlay");
  overlay.classList.remove("hidden");

  $("#onboardOk").onclick = () => {
    if ($("#dontShow").checked) localStorage.setItem(ONBOARD_KEY, "true");
    overlay.classList.add("hidden");
  };

  $("#showGuideLater").onclick = (e) => {
    e.preventDefault();
    overlay.classList.add("hidden");
  };
}

async function refresh() {
  const symbols = DOW30.map(s => s.symbol);
  const snap = await getSnapshot(symbols);

  $("#asof").textContent = snap._meta?.asof_local || snap._meta?.asof_market || "—";

  // Simple home regime summary (uses snapshot meta note; v2 event/regime engine can overwrite)
  $("#homeRegimeTitle").textContent = `MARKET REGIME: ${snap._meta?.session || "—"}`;
  $("#homeRegimeSub").textContent = snap._meta?.note || "Signals update from cached snapshots.";
  $("#homeRegimeMeta").textContent = `Source: ${snap._meta?.source || "—"}`;

  for (const s of DOW30) {
    const d = snap[s.symbol];
    if (!d || d.error) continue;

    const last = Number(d.last);
    const prev = Number(d.meta?.previous_close);
    const chg = Number.isFinite(last) && Number.isFinite(prev) ? (last - prev) : null;
    const chgPct = Number.isFinite(last) && Number.isFinite(prev) && prev !== 0 ? (chg / prev) : null;

    const tile = document.getElementById(`ptile-${s.symbol}`);
    if (!tile) continue;

    document.getElementById(`pprice-${s.symbol}`).textContent = Number.isFinite(last) ? `$${fmt(last)}` : "—";

    const chgEl = document.getElementById(`pchg-${s.symbol}`);
    if (chg === null || chgPct === null) {
      chgEl.textContent = "—";
      tile.classList.remove("pos", "neg");
    } else {
      const sign = chg > 0 ? "+" : "";
      chgEl.textContent = `${sign}$${fmt(chg)} (${sign}${fmtPct(chgPct)})`;
      tile.classList.toggle("pos", chgPct > 0);
      tile.classList.toggle("neg", chgPct < 0);
    }
  }

  const active = await getActiveEvent();
  if (active?.event_id) {
    $("#homeEventLine").textContent = `Active event: ${active.title || active.event_id} • ${active.event_type || "—"} • Day ${active.days_recorded || 0}/10`;
  } else {
    $("#homeEventLine").textContent = "Active event: —";
  }
}

(function boot() {
  const buckets = groupByCohort(DOW30);
  $("#periodicRow").innerHTML = buckets.map(cohortColumnHTML).join("");
  wireClicks();
  maybeShowOnboarding();

  refresh().catch(() => {});
  setInterval(() => refresh().catch(() => {}), 30_000);
})();
