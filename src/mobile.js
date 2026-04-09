// src/mobile.js
// MCM — Mobile Periodic Table View
// Drop-in module that activates on viewports < 900px.
// Receives the same `symbols`, `snap`, and `evt` objects from periodic.js
// so no duplicate data fetching is needed.

const $ = (sel) => document.querySelector(sel);

/* ============================================================
COHORT CONFIG — maps config.js keys to display properties
============================================================ */

const COHORT_META = {
liquidity_leader: {
label: “Liquidity”,
shortLabel: “LIQ”,
cls: “mob-c1”,
color: “#60a5fa”,
seqStep: 0,
},
reflex_bounce: {
label: “Reflexive”,
shortLabel: “REF”,
cls: “mob-c2”,
color: “#c084fc”,
seqStep: 1,
},
macro_sensitive: {
label: “Macro”,
shortLabel: “MAC”,
cls: “mob-c3”,
color: “#34d399”,
seqStep: 2,
},
cyclical: {
label: “Cyclical”,
shortLabel: “CYC”,
cls: “mob-c4”,
color: “#fb923c”,
seqStep: 3,
},
defensive: {
label: “Defensive”,
shortLabel: “DEF”,
cls: “mob-c5”,
color: “#f87171”,
seqStep: 4,
},
};

const COHORT_ORDER = [
“liquidity_leader”,
“reflex_bounce”,
“macro_sensitive”,
“cyclical”,
“defensive”,
];

/* ============================================================
FORMAT HELPERS
============================================================ */

function fmtPrice(n) {
const x = Number(n);
if (!Number.isFinite(x)) return “—”;
return x.toLocaleString(undefined, {
minimumFractionDigits: 2,
maximumFractionDigits: 2,
});
}

function fmtChg(chg) {
if (!Number.isFinite(chg)) return “—”;
const sign = chg >= 0 ? “+” : “”;
return `${sign}${fmtPrice(chg)}`;
}

function fmtPct(pct) {
if (!Number.isFinite(pct)) return “”;
const sign = pct >= 0 ? “+” : “”;
return `${sign}${(pct * 100).toFixed(2)}%`;
}

function getTileSignal(d) {
if (!d) return “neutral”;
const rth = !!(d?.rth?.reversal?.confirmed);
const eth = !!(d?.eth?.reversal?.confirmed);
if (rth || eth) return “confirmed”;

const last = Number(d?.last);
const prev = Number(d?.previous_close) || Number(d?.meta?.previous_close) || NaN;
if (Number.isFinite(last) && Number.isFinite(prev) && prev !== 0) {
const chg = last - prev;
if (chg < 0) return “down”;
return “forming”;
}
return “neutral”;
}

/* ============================================================
MOBILE VIEW STATE
============================================================ */

let _state = {
screen: “table”, // “table” | “detail”
selectedSym: null,
symbols: [],
symbolsBySym: {},
snap: null,
evt: null,
};

/* ============================================================
INJECT MOBILE SHELL INTO DOM
============================================================ */

export function injectMobileShell() {
// Only inject once
if ($(”#mobView”)) return;

const shell = document.createElement(“div”);
shell.id = “mobView”;
shell.className = “mob-view”;
shell.innerHTML = `
<!-- TABLE SCREEN -->
<div class="mob-screen active" id="mobScreenTable">

```
  <div class="mob-table-header">
    <div class="mob-header-row1">
      <span class="mob-brand">RISKXLABS / MCM</span>
      <div class="mob-regime-pill" id="mobRegimePill">
        <div class="mob-regime-dot"></div>
        <span id="mobRegimePillText">—</span>
      </div>
    </div>
    <div class="mob-main-title">PERIODIC TABLE<br>OF THE DOW</div>

    <div class="mob-legend" id="mobLegend">
      ${COHORT_ORDER.map((k) => {
        const m = COHORT_META[k];
        return `<div class="mob-legend-item">
          <div class="mob-legend-swatch" style="background:${m.color}"></div>
          <span style="color:${m.color};font-size:8px;">${m.label}</span>
        </div>`;
      }).join("")}
    </div>
  </div>

  <!-- PERIODIC TABLE GRID -->
  <div class="mob-pt-container">
    <div class="mob-pt-master" id="mobPtMaster">
      <!-- rendered by renderMobileTable() -->
    </div>
  </div>

  <!-- RECOVERY SEQUENCE -->
  <div class="mob-sequence-bar" id="mobSeqBar">
    <!-- rendered by renderSequenceBar() -->
  </div>
  <div class="mob-seq-labels" id="mobSeqLabels">
    <!-- rendered by renderSequenceBar() -->
  </div>

  <!-- TICKER TAPE -->
  <div class="mob-ticker">
    <div class="mob-ticker-inner" id="mobTickerInner">
      <!-- rendered by renderTicker() -->
    </div>
  </div>

  <!-- EVENT CARD -->
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

    <!-- REGIME PHASE BLOCKS -->
    <div class="mob-regime-card">
      <div class="mob-regime-card-header">
        <span class="mob-regime-card-title">Market Regime</span>
        <span class="mob-regime-card-sub">Current phase</span>
      </div>
      <div class="mob-phase-blocks" id="mobPhaseBlocks">
        <div class="mob-phase-block mob-phase-roff" id="mobPhaseRoff">
          <div class="mob-phase-pip"></div>
          <div class="mob-phase-icon">🧊</div>
          <div class="mob-phase-label">Risk-Off</div>
          <div class="mob-phase-desc">Defensive<br>leadership</div>
        </div>
        <div class="mob-phase-block mob-phase-trans" id="mobPhaseTrans">
          <div class="mob-phase-pip"></div>
          <div class="mob-phase-icon">🌊</div>
          <div class="mob-phase-label">Transition</div>
          <div class="mob-phase-desc">Rotation /<br>caution</div>
        </div>
        <div class="mob-phase-block mob-phase-ron" id="mobPhaseRon">
          <div class="mob-phase-pip"></div>
          <div class="mob-phase-icon">🔥</div>
          <div class="mob-phase-label">Risk-On</div>
          <div class="mob-phase-desc">Broad<br>participation</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- DETAIL SCREEN -->
<div class="mob-screen" id="mobScreenDetail">
  <div class="mob-det-header">
    <div class="mob-back-btn" id="mobBackBtn">‹ TABLE</div>

    <div class="mob-big-element" id="mobBigEl">
      <div class="mob-big-el-num" id="mobBigNum">1</div>
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
      <div class="mob-el-data-label">Cohort</div>
      <div class="mob-el-data-val" id="mobDetCohortVal">—</div>
    </div>
    <div class="mob-el-data-row">
      <div class="mob-el-data-label">Category</div>
      <div class="mob-el-data-val mob-el-data-sub" id="mobDetCategory">—</div>
    </div>
    <div class="mob-el-data-row">
      <div class="mob-el-data-label">Signal</div>
      <div class="mob-el-data-val" id="mobDetSignal">—</div>
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
</div>

<!-- TAB BAR -->
<div class="mob-tab-bar">
  <div class="mob-tab mob-tab-active" id="mobTabTable" data-tab="table">
    <div class="mob-tab-icon">⊞</div>
    <div class="mob-tab-lbl">TABLE</div>
  </div>
  <div class="mob-tab" id="mobTabEvents" data-tab="events">
    <div class="mob-tab-icon">⚡</div>
    <div class="mob-tab-lbl">EVENTS</div>
  </div>
  <div class="mob-tab" id="mobTabPerf" data-tab="perf">
    <div class="mob-tab-icon">▲</div>
    <div class="mob-tab-lbl">PERF</div>
  </div>
  <div class="mob-tab" id="mobTabPlay" data-tab="play">
    <div class="mob-tab-icon">📋</div>
    <div class="mob-tab-lbl">PLAYBOOK</div>
  </div>
</div>
```

`;

// Insert before the existing .shell so it sits at top of body
document.body.insertBefore(shell, document.body.firstChild);

wireMobileEvents();
}

/* ============================================================
RENDER: PERIODIC TABLE GRID
============================================================ */

function renderMobileTable(symbols, snap) {
const master = $(”#mobPtMaster”);
if (!master) return;

// Group by cohort, preserve config order
const grouped = {};
for (const s of symbols) {
const k = s.cohort || “other”;
if (!grouped[k]) grouped[k] = [];
grouped[k].push(s);
}

// Column headers (up to 8 columns across all rows)
const maxCols = Math.max(
…COHORT_ORDER.map((k) => (grouped[k] || []).length)
);
const colCount = Math.min(maxCols, 8);

let html = “”;

// Column header row
html += `<div class="mob-col-hdr mob-col-hdr-empty"></div>`;
for (let i = 1; i <= colCount; i++) {
html += `<div class="mob-col-hdr">${toRoman(i)}</div>`;
}

let atomicNum = 1;

for (const cohortKey of COHORT_ORDER) {
const list = grouped[cohortKey] || [];
if (!list.length) continue;

```
const meta = COHORT_META[cohortKey] || {
  label: cohortKey,
  cls: "mob-c1",
  color: "#888",
};

// Row label
html += `
  <div class="mob-row-label" style="position:relative;">
    <span class="mob-row-label-name" style="color:${meta.color}">${meta.shortLabel || meta.label.slice(0, 3).toUpperCase()}</span>
    <div style="position:absolute;right:0;top:0;bottom:0;width:2px;background:${meta.color};opacity:.35;border-radius:1px;"></div>
  </div>
`;

// Element cells
list.forEach((s, idx) => {
  const d = snap?.[s.symbol] || {};
  const last = Number(d.last);
  const prev =
    Number(d?.previous_close) ||
    Number(d?.meta?.previous_close) ||
    NaN;
  const hasData = Number.isFinite(last) && Number.isFinite(prev) && prev !== 0;

  const chg = hasData ? last - prev : NaN;
  const pct = hasData ? chg / prev : NaN;
  const isPos = hasData && chg >= 0;
  const isNeg = hasData && chg < 0;
  const signal = getTileSignal(d);

  const priceStr = hasData ? fmtPrice(last) : "—";
  const chgStr = hasData ? fmtChg(chg) : "—";
  const dirCls = isPos ? "pos" : isNeg ? "neg" : "";
  const signalCls = signal === "confirmed" ? "mob-el-confirmed"
    : signal === "down" ? "mob-el-down"
    : signal === "forming" ? "mob-el-forming"
    : "";

  html += `
    <div class="mob-el ${meta.cls} ${signalCls}"
         data-symbol="${s.symbol}"
         data-atomic="${atomicNum}">
      <div class="mob-el-num">${atomicNum}</div>
      <div class="mob-el-price ${dirCls}">${priceStr}</div>
      <div class="mob-el-sym">${s.symbol}</div>
      <div class="mob-el-change ${dirCls}">${chgStr}</div>
    </div>
  `;
  atomicNum++;
});

// Fill empty cells to complete the row
const emptyCells = colCount - list.length;
for (let e = 0; e < emptyCells; e++) {
  html += `<div class="mob-el mob-el-empty"></div>`;
}
```

}

// Set grid columns: label col + N data cols
master.style.gridTemplateColumns = `28px repeat(${colCount}, 1fr)`;
master.innerHTML = html;

// Wire tile clicks
master.querySelectorAll(”.mob-el[data-symbol]”).forEach((el) => {
el.addEventListener(“click”, () => {
const sym = el.getAttribute(“data-symbol”);
openDetail(sym);
});
});
}

function toRoman(n) {
const vals = [8, 7, 6, 5, 4, 3, 2, 1];
const syms = [“VIII”, “VII”, “VI”, “V”, “IV”, “III”, “II”, “I”];
for (let i = 0; i < vals.length; i++) {
if (n >= vals[i]) return syms[i];
}
return String(n);
}

/* ============================================================
RENDER: SEQUENCE BAR
============================================================ */

function renderSequenceBar(evt) {
const bar = $(”#mobSeqBar”);
const labels = $(”#mobSeqLabels”);
if (!bar || !labels) return;

// Determine active step from event code
const stepMap = {
panic: -1,
recovery: 2,
policy: 1,
macro: 1,
earnings: 0,
};
const activeStep = stepMap[evt?.code] ?? 0;

const steps = [
{ label: “Liquidity”, key: “liquidity_leader” },
{ label: “Reflexive”, key: “reflex_bounce” },
{ label: “Macro”, key: “macro_sensitive” },
{ label: “Defensive”, key: “defensive” },
];

let barHtml = “”;
let labelHtml = “”;

steps.forEach((step, i) => {
const state = i < activeStep ? “done” : i === activeStep ? “active” : “wait”;
barHtml += `<div class="mob-seq-step"><div class="mob-seq-fill mob-seq-${state}"></div></div>`;
if (i < steps.length - 1) {
barHtml += `<div class="mob-seq-arrow mob-seq-${state}"></div>`;
}
labelHtml += `<div class="mob-seq-label mob-seq-${state}">${step.label}</div>`;
});

bar.innerHTML = barHtml;
labels.innerHTML = labelHtml;
}

/* ============================================================
RENDER: TICKER TAPE
============================================================ */

function renderTicker(symbols, snap) {
const inner = $(”#mobTickerInner”);
if (!inner) return;

const items = symbols
.map((s) => {
const d = snap?.[s.symbol] || {};
const last = Number(d.last);
const prev =
Number(d?.previous_close) ||
Number(d?.meta?.previous_close) ||
NaN;

```
  if (!Number.isFinite(last)) return null;

  const chg = Number.isFinite(prev) && prev !== 0 ? ((last - prev) / prev) : NaN;
  const isPos = Number.isFinite(chg) && chg >= 0;
  const pctStr = Number.isFinite(chg)
    ? `${isPos ? "+" : ""}${(chg * 100).toFixed(2)}%`
    : "—";

  return `<div class="mob-t-item">
    <span class="mob-t-sym">${s.symbol}</span>
    ${fmtPrice(last)}
    <span class="${isPos ? "mob-t-pos" : "mob-t-neg"}">${pctStr}</span>
  </div>`;
})
.filter(Boolean);
```

// Duplicate for seamless loop
const markup = items.join(””);
inner.innerHTML = markup + markup;
}

/* ============================================================
RENDER: REGIME / EVENT CARDS
============================================================ */

function renderEventCard(evt, snap, symbols) {
if (!evt) return;

// Event label + pill
const pillEl = $(”#mobRegimePill”);
const pillText = $(”#mobRegimePillText”);
const eventLabel = $(”#mobEventLabel”);
const eventAsof = $(”#mobEventAsof”);
const eventName = $(”#mobEventName”);
const eventSub = $(”#mobEventSub”);

if (pillText) pillText.textContent = evt.label || “—”;
if (eventLabel) eventLabel.textContent = evt.label || “—”;
if (eventAsof) eventAsof.textContent = snap?._meta?.asof_local || “—”;
if (eventName) eventName.textContent = evt.label || “—”;
if (eventSub) {
eventSub.textContent = “MCM confirmed ›”;
eventSub.style.color =
evt.toneClass === “evt-green” ? “var(–mob-green)”
: evt.toneClass === “evt-red” ? “var(–mob-red)”
: “var(–mob-yellow)”;
}

// Pill color
if (pillEl) {
pillEl.className = “mob-regime-pill”;
if (evt.toneClass === “evt-green”) pillEl.classList.add(“mob-pill-green”);
else if (evt.toneClass === “evt-red”) pillEl.classList.add(“mob-pill-red”);
else if (evt.toneClass === “evt-orange” || evt.toneClass === “evt-yellow”)
pillEl.classList.add(“mob-pill-yellow”);
else pillEl.classList.add(“mob-pill-blue”);
}

// Breadth stats
const LEADERS = [“MSFT”, “AAPL”, “NVDA”, “V”];
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
if (Number.isFinite(last) && Number.isFinite(prev) && prev !== 0 && last >= prev) {
leadersUp++;
}
}

const pct = total ? Math.round((up / total) * 100) : 0;

const upEl = $(”#mobBreadthUp”);
const pctEl = $(”#mobBreadthPct”);
const leadEl = $(”#mobBreadthLeaders”);

if (upEl) {
upEl.textContent = total ? `${up}/${total}` : “—”;
upEl.className = `mob-breadout-val ${up >= total / 2 ? "pos" : "neg"}`;
}
if (pctEl) {
pctEl.textContent = total ? `${pct}%` : “—”;
pctEl.className = `mob-breadout-val ${pct >= 50 ? "pos" : "neg"}`;
}
if (leadEl) {
leadEl.textContent = `${leadersUp}/${LEADERS.length}`;
leadEl.className = `mob-breadout-val ${leadersUp >= 2 ? "pos" : "neg"}`;
}

// Regime phase blocks
const roff = $(”#mobPhaseRoff”);
const trans = $(”#mobPhaseTrans”);
const ron = $(”#mobPhaseRon”);

[roff, trans, ron].forEach((el) => {
if (el) el.classList.remove(“mob-phase-active”);
});

if (evt.toneClass === “evt-red” || evt.toneClass === “evt-blue”) {
roff?.classList.add(“mob-phase-active”);
} else if (evt.toneClass === “evt-orange” || evt.toneClass === “evt-yellow”) {
trans?.classList.add(“mob-phase-active”);
} else if (evt.toneClass === “evt-green”) {
ron?.classList.add(“mob-phase-active”);
} else {
trans?.classList.add(“mob-phase-active”);
}
}

/* ============================================================
DETAIL SCREEN
============================================================ */

function openDetail(sym) {
const s = _state.symbolsBySym[sym];
const snap = _state.snap;
const d = snap?.[sym] || {};

const last = Number(d.last);
const prev =
Number(d?.previous_close) ||
Number(d?.meta?.previous_close) ||
NaN;

const hasData = Number.isFinite(last) && Number.isFinite(prev) && prev !== 0;
const chg = hasData ? last - prev : NaN;
const pct = hasData ? chg / prev : NaN;
const isPos = hasData && chg >= 0;
const signal = getTileSignal(d);
const cohortKey = s?.cohort || “other”;
const cohortMeta = COHORT_META[cohortKey] || { label: cohortKey, color: “#888”, cls: “mob-c1” };

// Find atomic number from the table
const tileEl = document.querySelector(`.mob-el[data-symbol="${sym}"]`);
const atomicNum = tileEl?.getAttribute(“data-atomic”) || “—”;

// Big element card
const bigEl = $(”#mobBigEl”);
if (bigEl) {
bigEl.className = `mob-big-element ${cohortMeta.cls}`;
bigEl.style.borderColor = signal === “confirmed”
? “rgba(34,197,94,.5)”
: signal === “down”
? “rgba(239,68,68,.4)”
: “rgba(234,179,8,.45)”;
}

setText(“mobBigNum”, atomicNum);
setText(“mobBigSym”, sym);
setStyledText(“mobBigSym”,
signal === “confirmed” ? “#86efac”
: signal === “down” ? “#fca5a5”
: “#fde68a”
);
setText(“mobBigName”, (s?.name || sym).split(” “)[0]);
setText(“mobBigWeight”, hasData ? fmtPrice(last) : “—”);

// Company info
setText(“mobDetName”, s?.name || sym);
setText(“mobDetCat”, s?.category || “—”);

// Badge
const badge = $(”#mobDetBadge”);
if (badge) {
badge.className = `mob-mbadge mob-mbadge-${signal}`;
badge.textContent = signal === “confirmed” ? “Confirmed”
: signal === “down” ? “No Confirm”
: “Setup Forming”;
}

const cohortBadge = $(”#mobDetCohort”);
if (cohortBadge) {
cohortBadge.textContent = cohortMeta.label;
cohortBadge.style.color = cohortMeta.color;
cohortBadge.style.borderColor = cohortMeta.color + “44”;
cohortBadge.style.background = cohortMeta.color + “18”;
}

// Data table
setText(“mobDetPrice”, hasData ? `$${fmtPrice(last)}` : “—”);
const chgEl = $(”#mobDetChange”);
if (chgEl) {
chgEl.textContent = hasData ? fmtChg(chg) : “—”;
chgEl.className = `mob-el-data-sub ${isPos ? "pos" : "neg"}`;
}

const pctEl = $(”#mobDetPct”);
if (pctEl) {
pctEl.textContent = hasData ? fmtPct(pct) : “—”;
pctEl.className = `mob-el-data-val ${isPos ? "pos" : "neg"}`;
}

const cohortValEl = $(”#mobDetCohortVal”);
if (cohortValEl) {
cohortValEl.textContent = cohortMeta.label;
cohortValEl.style.color = cohortMeta.color;
}

setText(“mobDetCategory”, s?.category || “—”);

const signalEl = $(”#mobDetSignal”);
if (signalEl) {
signalEl.textContent = signal === “confirmed” ? “⚡ RTH Confirmed”
: signal === “down” ? “⚠ No Confirmation”
: “◎ Setup Forming”;
signalEl.className = `mob-el-data-val mob-signal-${signal}`;
}

// About — use blurb from config or fallback to category
const aboutEl = $(”#mobDetAbout”);
if (aboutEl) {
aboutEl.textContent = s?.blurb || s?.category || “—”;
}

// Signal box
const sigBox = $(”#mobSignalBox”);
if (sigBox) {
sigBox.className = `mob-signal-box mob-signal-box-${signal}`;
}
setText(“mobSignalTitle”,
signal === “confirmed” ? “⚡ MCM Signal — Confirmed”
: signal === “down” ? “⚠ MCM Signal — No Confirmation”
: “◎ MCM Signal — Setup Forming”
);

// Generate signal text from live data
const sigText = buildSignalText(sym, signal, cohortMeta, hasData, chg, pct, s);
setText(“mobSignalText”, sigText);

// Switch screen
showMobScreen(“detail”);
_state.selectedSym = sym;
}

function buildSignalText(sym, signal, cohortMeta, hasData, chg, pct, s) {
if (!hasData) return `No price data available for ${sym} yet.`;

const pctStr = fmtPct(pct);
const dir = chg >= 0 ? “up” : “down”;

if (signal === “confirmed”) {
return `${sym} is ${dir} ${pctStr} with RTH reversal confirmed. ` +
`${cohortMeta.label} cohort participation. Textbook behavior for this market structure.`;
}
if (signal === “down”) {
return `${sym} is ${dir} ${pctStr}. No reversal confirmation yet. ` +
`Watch for a reclaim of the intraday baseline before assigning signal weight.`;
}
return `${sym} is ${dir} ${pctStr}. Setup forming — reversal not yet confirmed in RTH session. ` +
`Monitor for continuation or failure at prior session levels.`;
}

function setText(id, val) {
const el = $(`#${id}`);
if (el) el.textContent = val;
}

function setStyledText(id, color) {
const el = $(`#${id}`);
if (el) el.style.color = color;
}

/* ============================================================
SCREEN SWITCHING
============================================================ */

function showMobScreen(name) {
document.querySelectorAll(”.mob-screen”).forEach((s) => s.classList.remove(“active”));
const target = name === “detail” ? $(”#mobScreenDetail”) : $(”#mobScreenTable”);
if (target) {
target.classList.add(“active”);
target.scrollTop = 0;
}

// Tab bar state
document.querySelectorAll(”.mob-tab”).forEach((t) => t.classList.remove(“mob-tab-active”));
const activeTab = $(`#mobTab${name.charAt(0).toUpperCase() + name.slice(1)}`);
if (activeTab) activeTab.classList.add(“mob-tab-active”);
else $(”#mobTabTable”)?.classList.add(“mob-tab-active”);

_state.screen = name;
}

/* ============================================================
WIRE MOBILE EVENTS
============================================================ */

function wireMobileEvents() {
// Back button
document.addEventListener(“click”, (e) => {
if (e.target.closest(”#mobBackBtn”)) {
showMobScreen(“table”);
}
});

// Tab bar — navigate to existing pages or switch screens
document.addEventListener(“click”, (e) => {
const tab = e.target.closest(”.mob-tab”);
if (!tab) return;
const tabId = tab.getAttribute(“data-tab”);

```
if (tabId === "table") {
  showMobScreen("table");
} else if (tabId === "events") {
  window.location.href = "/events.html";
} else if (tabId === "perf") {
  window.location.href = "/performance.html";
} else if (tabId === "play") {
  window.location.href = "/faq.html";
}
```

});
}

/* ============================================================
PUBLIC API — called from periodic.js
============================================================ */

/**

- Initialize the mobile view.
- Call this once after symbols are loaded.
  */
  export function initMobileView(symbols, symbolsBySym) {
  _state.symbols = symbols;
  _state.symbolsBySym = symbolsBySym;
  injectMobileShell();
  }

/**

- Refresh the mobile view with fresh snapshot + event data.
- Call this every time periodic.js refreshes.
  */
  export function refreshMobileView(snap, evt) {
  _state.snap = snap;
  _state.evt = evt;

renderMobileTable(_state.symbols, snap);
renderSequenceBar(evt);
renderTicker(_state.symbols, snap);
renderEventCard(evt, snap, _state.symbols);
}

/**

- Returns true if the mobile view is currently active/visible.
  */
  export function isMobileViewActive() {
  return window.matchMedia(”(max-width: 900px)”).matches;
  }
