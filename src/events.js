import { getActiveEvent, getEventsIndex } from "./api.js";

const $ = (sel) => document.querySelector(sel);

function setTab(which) {
  const active = which === "active";
  $("#tabActive").classList.toggle("active", active);
  $("#tabLibrary").classList.toggle("active", !active);
  $("#activePane").classList.toggle("hidden", !active);
  $("#libraryPane").classList.toggle("hidden", active);
}

function badge(text, tone = "neutral") {
  return `<span class="badge ${tone}">${text}</span>`;
}

async function loadActive() {
  const a = await getActiveEvent();

  const summary = $("#activeSummary");
  const chips = $("#activeChips");
  chips.innerHTML = "";

  if (!a || !a.event_id) {
    summary.textContent = "No active event right now.";
    $("#btnOpenReplay").setAttribute("href", "/events.html");
    $("#btnOpenReplay").classList.add("disabled");
    return;
  }

  const pieces = [
    a.title || a.event_id,
    a.event_type ? badge(a.event_type, "neutral") : "",
    a.regime_short ? badge(a.regime_short, "good") : "",
    (typeof a.days_recorded === "number") ? badge(`Day ${a.days_recorded}/10`, "neutral") : ""
  ].filter(Boolean);

  summary.innerHTML = pieces.join(" ");

  (a.tracked_symbols || []).forEach(sym => {
    const c = document.createElement("span");
    c.className = "chip";
    c.textContent = sym;
    chips.appendChild(c);
  });

  $("#btnOpenPerf").setAttribute("href", `/performance.html?event_id=${encodeURIComponent(a.event_id)}`);
  $("#btnOpenReplay").setAttribute("href", `/events.html?event_id=${encodeURIComponent(a.event_id)}`);
  $("#btnOpenReplay").classList.remove("disabled");
}

async function loadLibrary() {
  const events = await getEventsIndex();
  const list = $("#libraryList");
  list.innerHTML = "";

  if (!events.length) {
    list.innerHTML = `<div class="empty">No archived events yet.</div>`;
    return;
  }

  for (const e of events) {
    const row = document.createElement("div");
    row.className = "row";

    const left = document.createElement("div");
    left.className = "rowLeft";
    left.innerHTML = `
      <div class="rowTitle">${e.title || e.event_id}</div>
      <div class="rowSub">
        ${e.start_market_time || ""}
        ${e.event_type ? ` • ${e.event_type}` : ""}
        ${e.regime_short ? ` • ${e.regime_short}` : ""}
        ${typeof e.days_recorded === "number" ? ` • Days: ${e.days_recorded}` : ""}
      </div>
    `;

    const right = document.createElement("div");
    right.className = "rowRight";
    const a = document.createElement("a");
    a.className = "btn";
    a.href = `/performance.html?event_id=${encodeURIComponent(e.event_id)}`;
    a.textContent = "Replay";
    right.appendChild(a);

    row.appendChild(left);
    row.appendChild(right);
    list.appendChild(row);
  }
}

(function boot() {
  $("#tabActive").onclick = () => setTab("active");
  $("#tabLibrary").onclick = () => setTab("library");

  loadActive();
  loadLibrary();
})();
