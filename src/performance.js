import { SYMBOLS } from "./config.js";
import { getSnapshot, getActiveEvent, getEventsIndex } from "./api.js";

const $ = (sel) => document.querySelector(sel);

function fmt(n) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function fmtPct(p) {
  if (!Number.isFinite(p)) return "—";
  return (p * 100).toFixed(2) + "%";
}

function setMode(mode) {
  const live = mode === "live";
  $("#modeLive").classList.toggle("active", live);
  $("#modeReplay").classList.toggle("active", !live);
  $("#eventSelectWrap").classList.toggle("hidden", live);
  $("#replayNote").classList.toggle("hidden", live);

  $("#perfTitle").textContent = live ? "Live Performance (Today)" : "Event Replay (Selected Event)";
  $("#perfSub").textContent = live
    ? "Change vs previous close + intraday-high behavior vs baseline."
    : "Replay mode uses event baselines and stored outcomes (day-by-day).";
}

function getParam(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

function setParam(name, value) {
  const u = new URL(window.location.href);
  if (value === null || value === undefined || value === "") u.searchParams.delete(name);
  else u.searchParams.set(name, value);
  window.history.replaceState({}, "", u.toString());
}

async function populateEventSelect(selectedId) {
  const sel = $("#eventSelect");
  sel.innerHTML = "";

  const active = await getActiveEvent();
  const idx = await getEventsIndex();

  const options = [];
  if (active?.event_id) options.push({ ...active, _label: `Active (LIVE) — ${active.title || active.event_id}` });
  idx.forEach(e => options.push({ ...e, _label: `${e.title || e.event_id}` }));

  if (!options.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No events available";
    sel.appendChild(opt);
    return null;
  }

  for (const e of options) {
    const opt = document.createElement("option");
    opt.value = e.event_id;
    opt.textContent = e._label;
    sel.appendChild(opt);
  }

  const pick = selectedId && options.some(o => o.event_id === selectedId)
    ? selectedId
    : options[0].event_id;

  sel.value = pick;
  return pick;
}

function renderBadges(e) {
  const wrap = $("#eventBadges");
  wrap.innerHTML = "";
  if (!e) return;

  const mk = (t) => {
    const b = document.createElement("span");
    b.className = "badge";
    b.textContent = t;
    return b;
  };

  if (e.event_type) wrap.appendChild(mk(e.event_type));
  if (e.regime_short) wrap.appendChild(mk(e.regime_short));
  if (typeof e.days_recorded === "number") wrap.appendChild(mk(`Day ${e.days_recorded}/10`));
}

async function loadLiveTable() {
  const syms = SYMBOLS.map(s => s.symbol);
  const snap = await getSnapshot(syms);

  const tbody = $("#perfTable tbody");
  tbody.innerHTML = "";

  for (const s of SYMBOLS) {
    const d = snap[s.symbol];
    const tr = document.createElement("tr");

    if (!d || d.error) {
      tr.innerHTML = `<td>${s.symbol}</td><td colspan="5">No data</td>`;
      tbody.appendChild(tr);
      continue;
    }

    const last = Number(d.last);
    const prev = Number(d.meta?.previous_close);
    const chg = Number.isFinite(last) && Number.isFinite(prev) ? (last - prev) : null;
    const chgPct = Number.isFinite(last) && Number.isFinite(prev) && prev !== 0 ? (chg / prev) : null;

    const rthHigh = Number(d.rth?.high);
    const base = Number(d.baseline);
    const perfHigh = Number(d.rth?.perfHigh);
    const rev = !!d.rth?.reversal?.confirmed;

    tr.innerHTML = `
      <td><strong>${s.symbol}</strong><div class="muted small">${s.name}</div></td>
      <td>$${fmt(last)}</td>
      <td class="${chg > 0 ? "good" : chg < 0 ? "bad" : ""}">${chg === null ? "—" : `${chg > 0 ? "+" : ""}$${fmt(chg)}`}</td>
      <td class="${chgPct > 0 ? "good" : chgPct < 0 ? "bad" : ""}">${chgPct === null ? "—" : `${chgPct > 0 ? "+" : ""}${fmtPct(chgPct)}`}</td>
      <td>${Number.isFinite(perfHigh) ? `${fmtPct(perfHigh)} <span class="muted small">(High $${fmt(rthHigh)} vs Base $${fmt(base)})</span>` : "—"}</td>
      <td><span class="badge ${rev ? "good" : "bad"}">${rev ? "CONFIRMED" : "NOT YET"}</span></td>
    `;

    tbody.appendChild(tr);
  }
}

async function loadReplay(eventId) {
  // v2: wire to event APIs later. For now, we set the links and show the note.
  const active = await getActiveEvent();
  const idx = await getEventsIndex();
  const e = (active?.event_id === eventId)
    ? active
    : (idx.find(x => x.event_id === eventId) || null);

  renderBadges(e);
  $("#linkOpenEvent").setAttribute("href", `/events.html?event_id=${encodeURIComponent(eventId)}`);
  $("#linkOpenLive").setAttribute("href", `/live.html?event_id=${encodeURIComponent(eventId)}`);

  // Keep table populated with live info as a helpful fallback
  await loadLiveTable();
}

function copyCurrentLink() {
  navigator.clipboard?.writeText(window.location.href).catch(() => {});
  $("#copyLink").textContent = "Copied";
  setTimeout(() => { $("#copyLink").textContent = "Copy Link"; }, 900);
}

(async function boot() {
  $("#copyLink").onclick = copyCurrentLink;

  const urlEvent = getParam("event_id");
  if (urlEvent) {
    setMode("replay");
    const picked = await populateEventSelect(urlEvent);
    if (picked) {
      setParam("event_id", picked);
      await loadReplay(picked);
    }
  } else {
    setMode("live");
    await loadLiveTable();
  }

  $("#modeLive").onclick = async () => {
    setParam("event_id", null);
    setMode("live");
    renderBadges(null);
    $("#linkOpenEvent").setAttribute("href", "/events.html");
    $("#linkOpenLive").setAttribute("href", "/live.html");
    await loadLiveTable();
  };

  $("#modeReplay").onclick = async () => {
    setMode("replay");
    const picked = await populateEventSelect(getParam("event_id"));
    if (picked) {
      setParam("event_id", picked);
      await loadReplay(picked);
    }
  };

  $("#eventSelect").onchange = async (e) => {
    const id = e.target.value;
    if (!id) return;
    setParam("event_id", id);
    await loadReplay(id);
  };
})();
