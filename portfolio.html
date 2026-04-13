<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>MCM | Portfolio Simulator</title>
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/src/styles.css" />
    <link rel="stylesheet" href="/src/mobile.css" />
    <style>
      /* =========================================================
         PORTFOLIO PAGE — MCM MOBILE-FIRST DESIGN
         Consistent with the periodic table aesthetic
         ========================================================= */

      * { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --p-bg:      #070d16;
        --p-bg2:     #0b1520;
        --p-bg3:     #0f1d2e;
        --p-border:  #162438;
        --p-border2: #1e3450;
        --p-text:    #ddeeff;
        --p-text2:   #6a90b0;
        --p-text3:   #2e4a64;
        --p-green:   #22c55e;
        --p-red:     #ef4444;
        --p-yellow:  #eab308;
        --p-blue:    #3b82f6;
        --p-cyan:    #22d3ee;
        --p-mono:    'Share Tech Mono', ui-monospace, monospace;
      }

      body {
        background: var(--p-bg);
        color: var(--p-text);
        font-family: 'Rajdhani', sans-serif;
        min-height: 100vh;
        overflow-x: hidden;
      }

      body::before {
        content: '';
        position: fixed; inset: 0;
        background:
          radial-gradient(ellipse 70% 40% at 50% 0%, rgba(34,197,94,.04) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 80% 100%, rgba(59,130,246,.04) 0%, transparent 60%);
        pointer-events: none;
        z-index: 0;
      }

      /* ── LAYOUT ── */
      .port-shell {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        position: relative;
        z-index: 1;
        padding-bottom: 80px;
      }

      /* ── HEADER ── */
      .port-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(7,13,22,.95);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--p-border);
        padding: 14px 16px 12px;
      }

      .port-header-row1 {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .port-brand {
        font-family: var(--p-mono);
        font-size: 10px;
        letter-spacing: .15em;
        color: var(--p-text2);
      }

      .port-header-title {
        font-family: var(--p-mono);
        font-size: 13px;
        letter-spacing: .08em;
        color: var(--p-text);
        font-weight: 700;
        line-height: 1.3;
        margin-bottom: 8px;
      }

      .port-status-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }

      .port-status-pill {
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(34,197,94,.08);
        border: 1px solid rgba(34,197,94,.2);
        border-radius: 20px;
        padding: 3px 10px;
        font-family: var(--p-mono);
        font-size: 9px;
        letter-spacing: .1em;
        color: var(--p-green);
      }

      .port-status-dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        background: var(--p-green);
        box-shadow: 0 0 6px var(--p-green);
        animation: port-pulse 2s infinite;
      }

      @keyframes port-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

      /* ── TAB BAR ── */
      .port-tab-bar {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        height: 72px;
        background: rgba(7,13,22,.96);
        backdrop-filter: blur(20px);
        border-top: 1px solid var(--p-border);
        display: flex;
        align-items: flex-start;
        justify-content: space-around;
        padding: 10px 0 0;
        z-index: 200;
      }

      .port-tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        cursor: pointer;
        padding: 4px 16px;
        border: none;
        background: transparent;
        box-shadow: none;
        border-radius: 10px;
        color: var(--p-text3);
        text-decoration: none;
      }

      .port-tab:active { transform: scale(.88); }
      .port-tab-icon { font-size: 20px; line-height: 1; }
      .port-tab-lbl {
        font-family: var(--p-mono);
        font-size: 8px;
        letter-spacing: .08em;
        color: var(--p-text3);
      }
      .port-tab.active .port-tab-lbl { color: var(--p-blue); }

      /* ── MAIN CONTENT ── */
      .port-main {
        padding: 0 0 16px;
      }

      /* ── COMMAND BAR — user/portfolio selector ── */
      .port-command-bar {
        margin: 12px 14px;
        background: var(--p-bg3);
        border: 1px solid var(--p-border2);
        border-radius: 14px;
        padding: 14px;
      }

      .port-command-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .port-section-label {
        font-family: var(--p-mono);
        font-size: 9px;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--p-text3);
      }

      .port-command-meta {
        font-family: var(--p-mono);
        font-size: 9px;
        color: var(--p-text2);
      }

      .port-selects {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 10px;
      }

      .port-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .port-field-label {
        font-family: var(--p-mono);
        font-size: 8px;
        letter-spacing: .1em;
        text-transform: uppercase;
        color: var(--p-text3);
      }

      .port-select,
      .port-input,
      .port-textarea {
        background: rgba(6,14,26,.8);
        border: 1px solid var(--p-border2);
        color: var(--p-text);
        padding: 10px 12px;
        border-radius: 10px;
        font-family: var(--p-mono);
        font-size: 12px;
        width: 100%;
        outline: none;
        transition: border-color .15s;
        -webkit-appearance: none;
      }

      .port-select:focus,
      .port-input:focus,
      .port-textarea:focus {
        border-color: rgba(59,130,246,.5);
        box-shadow: 0 0 0 1px rgba(59,130,246,.1);
      }

      .port-select option {
        background: #0b1520;
      }

      .port-new-portfolio {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .port-new-portfolio .port-input {
        flex: 1;
      }

      .port-btn {
        background: rgba(59,130,246,.12);
        border: 1px solid rgba(59,130,246,.3);
        color: #93c5fd;
        padding: 10px 14px;
        border-radius: 10px;
        font-family: var(--p-mono);
        font-size: 10px;
        letter-spacing: .06em;
        cursor: pointer;
        white-space: nowrap;
        transition: all .15s;
      }

      .port-btn:hover {
        border-color: rgba(59,130,246,.6);
        background: rgba(59,130,246,.18);
      }

      .port-btn:active { transform: scale(.95); }

      .port-btn-submit {
        background: rgba(34,197,94,.12);
        border-color: rgba(34,197,94,.35);
        color: #86efac;
        width: 100%;
        padding: 14px;
        font-size: 11px;
        letter-spacing: .1em;
        margin-top: 4px;
      }

      .port-btn-submit:hover {
        background: rgba(34,197,94,.2);
        border-color: rgba(34,197,94,.55);
      }

      /* ── SUMMARY CARDS ── */
      .port-summary {
        margin: 0 14px 12px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .port-stat-card {
        background: var(--p-bg3);
        border: 1px solid var(--p-border2);
        border-radius: 12px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .port-stat-label {
        font-family: var(--p-mono);
        font-size: 8px;
        letter-spacing: .1em;
        text-transform: uppercase;
        color: var(--p-text3);
      }

      .port-stat-val {
        font-family: var(--p-mono);
        font-size: 22px;
        font-weight: 700;
        color: var(--p-text);
        line-height: 1;
      }

      .port-stat-val.pos { color: var(--p-green); }
      .port-stat-val.neg { color: var(--p-red); }

      /* ── ORDER ENTRY SECTION ── */
      .port-section {
        margin: 0 14px 12px;
        background: var(--p-bg3);
        border: 1px solid var(--p-border2);
        border-radius: 14px;
        overflow: hidden;
      }

      .port-section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border-bottom: 1px solid var(--p-border);
        cursor: pointer;
        user-select: none;
      }

      .port-section-head-left {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .port-section-title {
        font-family: var(--p-mono);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .1em;
        text-transform: uppercase;
        color: var(--p-text);
      }

      .port-section-sub {
        font-size: 11px;
        color: var(--p-text2);
      }

      .port-section-toggle {
        font-family: var(--p-mono);
        font-size: 14px;
        color: var(--p-text3);
        transition: transform .2s;
      }

      .port-section.collapsed .port-section-toggle {
        transform: rotate(-90deg);
      }

      .port-section-body {
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .port-section.collapsed .port-section-body {
        display: none;
      }

      /* Two-col grid for small fields */
      .port-two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .port-three-col {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
      }

      /* Symbol resolver */
      .port-symbol-resolved {
        font-family: var(--p-mono);
        font-size: 10px;
        color: var(--p-cyan);
        margin-top: 4px;
        padding: 6px 10px;
        background: rgba(34,211,238,.06);
        border: 1px solid rgba(34,211,238,.15);
        border-radius: 8px;
        min-height: 32px;
        display: flex;
        align-items: center;
      }

      /* Side toggle — BUY / SELL as big buttons */
      .port-side-toggle {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }

      .port-side-btn {
        padding: 12px;
        border-radius: 10px;
        font-family: var(--p-mono);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .12em;
        cursor: pointer;
        border: 2px solid transparent;
        text-align: center;
        transition: all .15s;
        background: rgba(255,255,255,.03);
        color: var(--p-text3);
        border-color: var(--p-border2);
      }

      .port-side-btn.active-buy {
        background: rgba(34,197,94,.12);
        border-color: rgba(34,197,94,.5);
        color: var(--p-green);
        box-shadow: 0 0 12px rgba(34,197,94,.1);
      }

      .port-side-btn.active-sell {
        background: rgba(239,68,68,.12);
        border-color: rgba(239,68,68,.4);
        color: var(--p-red);
        box-shadow: 0 0 12px rgba(239,68,68,.1);
      }

      /* Event rationale chips */
      .port-rationale-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .port-rationale-chip {
        padding: 6px 10px;
        border-radius: 20px;
        border: 1px solid var(--p-border2);
        background: rgba(255,255,255,.02);
        font-family: var(--p-mono);
        font-size: 9px;
        letter-spacing: .06em;
        color: var(--p-text2);
        cursor: pointer;
        transition: all .15s;
        white-space: nowrap;
      }

      .port-rationale-chip:hover {
        border-color: rgba(59,130,246,.4);
        color: var(--p-text);
      }

      .port-rationale-chip.selected {
        background: rgba(59,130,246,.12);
        border-color: rgba(59,130,246,.45);
        color: #93c5fd;
      }

      /* ── ORDER HISTORY ── */
      .port-orders {
        margin: 0 14px 12px;
      }

      .port-orders-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .port-order-card {
        background: var(--p-bg3);
        border: 1px solid var(--p-border2);
        border-radius: 12px;
        padding: 12px 14px;
        margin-bottom: 8px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 8px 12px;
        align-items: center;
      }

      .port-order-card.executed {
        border-color: rgba(34,197,94,.2);
      }

      .port-order-card.open {
        border-color: rgba(234,179,8,.2);
      }

      .port-order-sym {
        font-family: var(--p-mono);
        font-size: 20px;
        font-weight: 700;
        color: var(--p-cyan);
        line-height: 1;
      }

      .port-order-details {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .port-order-meta {
        font-family: var(--p-mono);
        font-size: 9px;
        color: var(--p-text2);
        letter-spacing: .04em;
      }

      .port-order-cohort {
        font-family: var(--p-mono);
        font-size: 9px;
        color: var(--p-text3);
      }

      .port-order-right {
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: flex-end;
      }

      .port-order-price {
        font-family: var(--p-mono);
        font-size: 14px;
        font-weight: 700;
        color: var(--p-text);
      }

      .port-order-status {
        font-family: var(--p-mono);
        font-size: 8px;
        letter-spacing: .08em;
        padding: 2px 7px;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .port-order-status.executed {
        background: rgba(34,197,94,.12);
        color: var(--p-green);
        border: 1px solid rgba(34,197,94,.25);
      }

      .port-order-status.open {
        background: rgba(234,179,8,.1);
        color: var(--p-yellow);
        border: 1px solid rgba(234,179,8,.25);
        animation: port-pulse 2s infinite;
      }

      .port-order-event {
        font-family: var(--p-mono);
        font-size: 8px;
        color: var(--p-blue);
        opacity: .8;
      }

      .port-empty {
        font-family: var(--p-mono);
        font-size: 11px;
        color: var(--p-text3);
        text-align: center;
        padding: 24px;
        letter-spacing: .06em;
      }

      /* Hidden select for order type (underlying) */
      .port-hidden { display: none; }

      /* ── TOAST NOTIFICATION ── */
      .port-toast {
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: var(--p-bg3);
        border: 1px solid rgba(34,197,94,.35);
        border-radius: 12px;
        padding: 12px 20px;
        font-family: var(--p-mono);
        font-size: 11px;
        color: var(--p-green);
        letter-spacing: .06em;
        z-index: 300;
        opacity: 0;
        transition: all .3s;
        white-space: nowrap;
        pointer-events: none;
      }

      .port-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      .port-toast.error {
        border-color: rgba(239,68,68,.35);
        color: var(--p-red);
      }

      /* ── DESKTOP ── */
      @media (min-width: 768px) {
        .port-main {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 0 24px;
        }

        .port-summary {
          grid-template-columns: repeat(4, 1fr);
        }

        .port-stat-val {
          font-size: 26px;
        }
      }
    </style>
  </head>

  <body>
    <div class="port-shell">

      <!-- HEADER -->
      <div class="port-header">
        <div class="port-header-row1">
          <span class="port-brand">RISKXLABS / MCM</span>
          <div class="port-status-pill">
            <div class="port-status-dot"></div>
            SIMULATED
          </div>
        </div>
        <div class="port-header-title">PORTFOLIO<br>SIMULATOR</div>
        <div class="port-status-row">
          <span style="font-family:var(--p-mono);font-size:9px;color:var(--p-text3);">DOW 30 ONLY</span>
          <span style="color:var(--p-border2);">·</span>
          <span style="font-family:var(--p-mono);font-size:9px;color:var(--p-text3);">3 PORTFOLIOS MAX</span>
          <span style="color:var(--p-border2);">·</span>
          <span style="font-family:var(--p-mono);font-size:9px;color:var(--p-text3);">$10,000 SEED</span>
        </div>
      </div>

      <div class="port-main">

        <!-- COMMAND BAR -->
        <div class="port-command-bar">
          <div class="port-command-header">
            <span class="port-section-label">Command Center</span>
            <span class="port-command-meta">
              <span id="selectedUserName">—</span>
              <span style="color:var(--p-border2);margin:0 4px;">·</span>
              <span id="selectedPortfolioName">No portfolio</span>
            </span>
          </div>

          <div class="port-selects">
            <div class="port-field">
              <span class="port-field-label">User</span>
              <select id="userSelect" class="port-select">
                <option value="">Select user…</option>
              </select>
            </div>
            <div class="port-field">
              <span class="port-field-label">Portfolio</span>
              <select id="portfolioSelect" class="port-select">
                <option value="">Select portfolio…</option>
              </select>
            </div>
          </div>

          <div class="port-field" style="margin-bottom:0;">
            <span class="port-field-label">New Portfolio</span>
            <div class="port-new-portfolio" style="margin-top:4px;">
              <input
                id="newPortfolioName"
                class="port-input"
                type="text"
                placeholder="e.g. Risk-Off Basket"
              />
              <button class="port-btn" id="createPortfolioBtn" type="button">+ Create</button>
            </div>
          </div>
        </div>

        <!-- SUMMARY CARDS -->
        <div class="port-summary">
          <div class="port-stat-card">
            <span class="port-stat-label">Starting Cash</span>
            <span class="port-stat-val" id="summaryStartingCash">$—</span>
          </div>
          <div class="port-stat-card">
            <span class="port-stat-label">Est. Cash</span>
            <span class="port-stat-val" id="summaryCash">$—</span>
          </div>
          <div class="port-stat-card">
            <span class="port-stat-label">Executed</span>
            <span class="port-stat-val pos" id="summaryExecutedCount">—</span>
          </div>
          <div class="port-stat-card">
            <span class="port-stat-label">Open Orders</span>
            <span class="port-stat-val" id="summaryOpenCount">—</span>
          </div>
        </div>

        <!-- ORDER ENTRY -->
        <div class="port-section" id="orderSection">
          <div class="port-section-head" id="orderSectionToggle">
            <div class="port-section-head-left">
              <span class="port-section-title">Order Entry</span>
              <span class="port-section-sub">Dow 30 only · Cohort auto-assigned</span>
            </div>
            <span class="port-section-toggle">▾</span>
          </div>

          <div class="port-section-body">

            <!-- Symbol -->
            <div class="port-field">
              <span class="port-field-label">Symbol</span>
              <input
                id="symbolInput"
                class="port-input"
                type="text"
                placeholder="AAPL"
                maxlength="8"
                style="text-transform:uppercase;font-size:16px;font-weight:700;letter-spacing:.1em;"
              />
              <div class="port-symbol-resolved" id="symbolResolvedText">
                Enter a Dow 30 ticker
              </div>
            </div>

            <!-- BUY / SELL toggle -->
            <div class="port-field">
              <span class="port-field-label">Side</span>
              <div class="port-side-toggle" style="margin-top:4px;">
                <button class="port-side-btn active-buy" id="sideBtn-buy" type="button">BUY</button>
                <button class="port-side-btn" id="sideBtn-sell" type="button">SELL</button>
              </div>
              <!-- Hidden select for JS compatibility -->
              <select id="sideSelect" class="port-hidden">
                <option value="buy" selected>Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>

            <!-- Qty + Order Type -->
            <div class="port-two-col">
              <div class="port-field">
                <span class="port-field-label">Quantity</span>
                <input id="quantityInput" class="port-input" type="number" min="1" step="1" placeholder="10" />
              </div>
              <div class="port-field">
                <span class="port-field-label">Order Type</span>
                <select id="orderTypeSelect" class="port-select">
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                  <option value="stop">Stop</option>
                  <option value="stop_limit">Stop Limit</option>
                  <option value="trailing_stop">Trailing Stop</option>
                </select>
              </div>
            </div>

            <!-- Prices -->
            <div class="port-three-col">
              <div class="port-field">
                <span class="port-field-label">Current $</span>
                <input id="currentPriceInput" class="port-input" type="number" min="0" step="0.01" placeholder="—" />
              </div>
              <div class="port-field">
                <span class="port-field-label">Limit $</span>
                <input id="limitPriceInput" class="port-input" type="number" min="0" step="0.01" placeholder="Optional" />
              </div>
              <div class="port-field">
                <span class="port-field-label">Stop $</span>
                <input id="stopPriceInput" class="port-input" type="number" min="0" step="0.01" placeholder="Optional" />
              </div>
            </div>

            <!-- Trailing + TIF -->
            <div class="port-two-col">
              <div class="port-field">
                <span class="port-field-label">Trailing %</span>
                <input id="trailingPercentInput" class="port-input" type="number" min="0" step="0.01" placeholder="e.g. 5" />
              </div>
              <div class="port-field">
                <span class="port-field-label">Time in Force</span>
                <select id="timeInForceSelect" class="port-select">
                  <option value="none">None</option>
                  <option value="gtc">GTC</option>
                </select>
              </div>
            </div>

            <!-- Event Rationale chips -->
            <div class="port-field">
              <span class="port-field-label">Event Rationale</span>
              <div class="port-rationale-chips" style="margin-top:6px;" id="rationaleChips">
                <div class="port-rationale-chip" data-val="">None</div>
                <div class="port-rationale-chip" data-val="Panic / Liquidation">🟥 Panic</div>
                <div class="port-rationale-chip" data-val="Risk-Off Rotation">🟦 Risk-Off</div>
                <div class="port-rationale-chip" data-val="Macro Repricing">🟧 Macro</div>
                <div class="port-rationale-chip" data-val="Recovery / Mean Reversion">🟩 Recovery</div>
                <div class="port-rationale-chip" data-val="Earnings-Driven">🟨 Earnings</div>
                <div class="port-rationale-chip" data-val="Other">Other</div>
              </div>
              <!-- Hidden select for JS compatibility -->
              <select id="eventRationaleSelect" class="port-hidden">
                <option value="">None</option>
                <option value="Panic / Liquidation">Panic / Liquidation</option>
                <option value="Risk-Off Rotation">Risk-Off Rotation</option>
                <option value="Macro Repricing">Macro Repricing</option>
                <option value="Recovery / Mean Reversion">Recovery / Mean Reversion</option>
                <option value="Earnings-Driven">Earnings-Driven</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Notes -->
            <div class="port-field">
              <span class="port-field-label">Notes</span>
              <textarea
                id="orderNotesInput"
                class="port-textarea"
                rows="2"
                placeholder="Optional trade rationale…"
                style="resize:none;margin-top:4px;"
              ></textarea>
            </div>

            <!-- Submit -->
            <button class="port-btn port-btn-submit" id="submitOrderBtn" type="button">
              ⚡ SUBMIT SIMULATED ORDER
            </button>

          </div>
        </div>

        <!-- ORDER HISTORY -->
        <div class="port-orders">
          <div class="port-orders-head">
            <span class="port-section-label">Order History</span>
            <span class="port-command-meta" id="orderCount">—</span>
          </div>
          <div id="ordersListMobile">
            <div class="port-empty">Select a user and portfolio to load orders.</div>
          </div>
        </div>

      </div><!-- /port-main -->

      <!-- TAB BAR -->
      <div class="port-tab-bar">
        <a class="port-tab" href="/">
          <div class="port-tab-icon">⊞</div>
          <div class="port-tab-lbl">TABLE</div>
        </a>
        <a class="port-tab" href="/events.html">
          <div class="port-tab-icon">⚡</div>
          <div class="port-tab-lbl">EVENTS</div>
        </a>
        <a class="port-tab active" href="/portfolio.html">
          <div class="port-tab-icon">💼</div>
          <div class="port-tab-lbl">PORTFOLIO</div>
        </a>
        <a class="port-tab" href="/faq.html">
          <div class="port-tab-icon">📋</div>
          <div class="port-tab-lbl">PLAYBOOK</div>
        </a>
      </div>

      <!-- TOAST -->
      <div class="port-toast" id="portToast"></div>

    </div><!-- /port-shell -->

    <script type="module">
      // ── IMPORT EXISTING PORTFOLIO JS ──
      // We re-use all the existing logic but patch the renderOrders
      // function to output mobile cards instead of a table.

      import { getSnapshot } from "/src/api.js";

      const $ = (sel) => document.querySelector(sel);

      const DOW30 = {
        MMM:{name:"3M",cohort:"Cyclicals / Industrials"},
        AXP:{name:"American Express",cohort:"Macro-Sensitive"},
        AMGN:{name:"Amgen",cohort:"Defensive / Yield"},
        AAPL:{name:"Apple",cohort:"Liquidity Leaders"},
        BA:{name:"Boeing",cohort:"Cyclicals / Industrials"},
        CAT:{name:"Caterpillar",cohort:"Cyclicals / Industrials"},
        CVX:{name:"Chevron",cohort:"Macro-Sensitive"},
        CSCO:{name:"Cisco",cohort:"Defensive / Yield"},
        KO:{name:"Coca-Cola",cohort:"Defensive / Yield"},
        DIS:{name:"Disney",cohort:"Reflex / Growth"},
        GS:{name:"Goldman Sachs",cohort:"Macro-Sensitive"},
        HD:{name:"Home Depot",cohort:"Macro-Sensitive"},
        HON:{name:"Honeywell",cohort:"Cyclicals / Industrials"},
        IBM:{name:"IBM",cohort:"Liquidity Leaders"},
        JNJ:{name:"Johnson & Johnson",cohort:"Defensive / Yield"},
        JPM:{name:"JPMorgan Chase",cohort:"Macro-Sensitive"},
        MCD:{name:"McDonald's",cohort:"Defensive / Yield"},
        MRK:{name:"Merck",cohort:"Defensive / Yield"},
        MSFT:{name:"Microsoft",cohort:"Liquidity Leaders"},
        NKE:{name:"Nike",cohort:"Reflex / Growth"},
        PG:{name:"Procter & Gamble",cohort:"Defensive / Yield"},
        CRM:{name:"Salesforce",cohort:"Reflex / Growth"},
        SHW:{name:"Sherwin-Williams",cohort:"Cyclicals / Industrials"},
        TRV:{name:"Travelers",cohort:"Defensive / Yield"},
        UNH:{name:"UnitedHealth",cohort:"Defensive / Yield"},
        VZ:{name:"Verizon",cohort:"Defensive / Yield"},
        V:{name:"Visa",cohort:"Liquidity Leaders"},
        WMT:{name:"Walmart",cohort:"Defensive / Yield"},
        NVDA:{name:"NVIDIA",cohort:"Liquidity Leaders"},
        AMZN:{name:"Amazon",cohort:"Reflex / Growth"},
      };

      const state = {
        users:[],portfolios:[],orders:[],
        selectedUserId:null,selectedUserName:"",
        selectedPortfolioId:null,selectedPortfolioName:"",
        selectedPortfolio:null,quoteRequestId:0,
        currentSide:"buy",currentRationale:""
      };

      /* ── HELPERS ── */
      function fmtMoney(n){const x=Number(n);if(!Number.isFinite(x))return"—";return x.toLocaleString(undefined,{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});}
      function fmtQty(n){const x=Number(n);if(!Number.isFinite(x))return"—";return x.toLocaleString(undefined,{minimumFractionDigits:x%1===0?0:2,maximumFractionDigits:2});}
      function safeText(v){return v===null||v===undefined||v===""?"—":String(v);}
      function capitalizeWords(s){return String(s||"").replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase());}
      function selectedUser(){return state.users.find(u=>Number(u.id)===Number(state.selectedUserId))||null;}
      function selectedPortfolio(){return state.portfolios.find(p=>Number(p.id)===Number(state.selectedPortfolioId))||null;}

      function showToast(msg, isError=false){
        const t=$("#portToast");
        if(!t)return;
        t.textContent=msg;
        t.className="port-toast"+(isError?" error":"");
        requestAnimationFrame(()=>{
          t.classList.add("show");
          setTimeout(()=>t.classList.remove("show"),2800);
        });
      }

      function resetSummary(){
        $("#summaryStartingCash").textContent="$—";
        $("#summaryCash").textContent="$—";
        $("#summaryExecutedCount").textContent="—";
        $("#summaryOpenCount").textContent="—";
      }

      function setHeaderMeta(){
        $("#selectedUserName").textContent=state.selectedUserName||"—";
        $("#selectedPortfolioName").textContent=state.selectedPortfolioName||"No portfolio";
        const metaUser = $("#metaUser");
        const metaPort = $("#metaPortfolio");
        if(metaUser) metaUser.textContent=state.selectedUserName||"—";
        if(metaPort) metaPort.textContent=state.selectedPortfolioName||"—";
      }

      /* ── API ── */
      async function getJson(url,options={}){
        const resp=await fetch(url,options);
        const data=await resp.json().catch(()=>({}));
        if(!resp.ok)throw new Error(data?.error||`Request failed: ${resp.status}`);
        return data;
      }

      async function loadUsers(){
        const data=await getJson("/api/users");
        state.users=Array.isArray(data?.items)?data.items:[];
        renderUsers();
      }

      async function loadPortfolios(userId){
        const data=await getJson(`/api/portfolios?user_id=${encodeURIComponent(userId)}`);
        state.portfolios=Array.isArray(data?.items)?data.items:[];
        renderPortfolios();
      }

      async function createPortfolio(userId,name){
        return getJson("/api/portfolios",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:Number(userId),name})});
      }

      async function loadOrders(portfolioId){
        const data=await getJson(`/api/orders?portfolio_id=${encodeURIComponent(portfolioId)}`);
        state.orders=Array.isArray(data?.items)?data.items:[];
        state.selectedPortfolio=data?.portfolio||selectedPortfolio()||null;
        renderOrders();
        renderSummary();
      }

      async function submitOrder(payload){
        return getJson("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      }

      /* ── RENDER ── */
      function renderUsers(){
        const sel=$("#userSelect");
        if(!sel)return;
        const current=String(state.selectedUserId||"");
        sel.innerHTML=`<option value="">Select user…</option>${state.users.map(u=>`<option value="${u.id}"${String(u.id)===current?" selected":""}>${u.name}</option>`).join("")}`;
      }

      function renderPortfolios(){
        const sel=$("#portfolioSelect");
        if(!sel)return;
        const current=String(state.selectedPortfolioId||"");
        sel.innerHTML=`<option value="">Select portfolio…</option>${state.portfolios.map(p=>`<option value="${p.id}"${String(p.id)===current?" selected":""}>${p.name}</option>`).join("")}`;
      }

      function renderOrders(){
        const list=$("#ordersListMobile");
        const countEl=$("#orderCount");
        if(!list)return;

        if(!state.selectedPortfolioId){
          list.innerHTML=`<div class="port-empty">Select a user and portfolio to load orders.</div>`;
          if(countEl)countEl.textContent="—";
          return;
        }

        if(!state.orders.length){
          list.innerHTML=`<div class="port-empty">No orders yet — submit your first trade above.</div>`;
          if(countEl)countEl.textContent="0 orders";
          return;
        }

        if(countEl)countEl.textContent=`${state.orders.length} order${state.orders.length!==1?"s":""}`;

        list.innerHTML=state.orders.map(o=>{
          const executed=o.executed_price!=null?fmtMoney(o.executed_price):"—";
          const statusCls=o.status==="executed"?"executed":"open";
          const time=o.executed_at||o.created_at||"";
          const timeStr=time?new Date(time).toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}):"—";
          const event=o.event_rationale?`<div class="port-order-event">${o.event_rationale}</div>`:"";

          return `
            <div class="port-order-card ${statusCls}">
              <div class="port-order-sym">${safeText(o.symbol)}</div>
              <div class="port-order-details">
                <div class="port-order-meta">${capitalizeWords(o.side)} · ${fmtQty(o.quantity)} shares · ${capitalizeWords(o.order_type)}</div>
                <div class="port-order-cohort">${safeText(o.cohort)} · ${timeStr}</div>
                ${event}
              </div>
              <div class="port-order-right">
                <div class="port-order-price">${executed}</div>
                <div class="port-order-status ${statusCls}">${capitalizeWords(o.status)}</div>
              </div>
            </div>
          `;
        }).join("");
      }

      function renderSummary(){
        if(!state.selectedPortfolio&&!selectedPortfolio()){resetSummary();return;}
        const portfolio=state.selectedPortfolio||selectedPortfolio();
        const startingCash=Number(portfolio?.starting_cash||10000);
        let estimatedCash=startingCash,executedCount=0,openCount=0;
        for(const o of state.orders){
          if(o.status==="executed"){
            executedCount++;
            const px=Number(o.executed_price),qty=Number(o.quantity);
            if(Number.isFinite(px)&&Number.isFinite(qty)){
              if(o.side==="buy")estimatedCash-=qty*px;
              if(o.side==="sell")estimatedCash+=qty*px;
            }
          }else if(o.status==="open"){openCount++;}
        }
        $("#summaryStartingCash").textContent=fmtMoney(startingCash);
        const cashEl=$("#summaryCash");
        cashEl.textContent=fmtMoney(estimatedCash);
        cashEl.className="port-stat-val"+(estimatedCash>=startingCash?" pos":" neg");
        $("#summaryExecutedCount").textContent=String(executedCount);
        $("#summaryOpenCount").textContent=String(openCount);
      }

      /* ── SYMBOL + QUOTE ── */
      async function autofillLivePrice(sym){
        const priceInput=$("#currentPriceInput");
        if(!priceInput)return;
        const requestId=++state.quoteRequestId;
        try{
          const snap=await getSnapshot([sym]);
          if(requestId!==state.quoteRequestId)return;
          const last=Number(snap?.[sym]?.last);
          if(Number.isFinite(last)&&last>0)priceInput.value=last.toFixed(2);
        }catch{}
      }

      async function resolveSymbolDisplay(){
        const input=$("#symbolInput");
        const out=$("#symbolResolvedText");
        if(!input||!out)return;
        const sym=String(input.value||"").trim().toUpperCase();
        input.value=sym;
        if(!sym){out.textContent="Enter a Dow 30 ticker";return;}
        const found=DOW30[sym];
        if(!found){out.textContent="Not in Dow 30 universe";out.style.color="var(--p-red)";out.style.borderColor="rgba(239,68,68,.2)";return;}
        out.textContent=`${found.name}  ·  ${found.cohort}`;
        out.style.color="var(--p-cyan)";
        out.style.borderColor="rgba(34,211,238,.2)";
        await autofillLivePrice(sym);
      }

      /* ── EVENTS ── */
      async function onUserChange(){
        const userId=Number($("#userSelect")?.value||0);
        state.selectedUserId=userId||null;
        state.selectedPortfolioId=null;state.selectedPortfolio=null;
        state.orders=[];state.portfolios=[];
        const user=selectedUser();
        state.selectedUserName=user?.name||"";
        state.selectedPortfolioName="";
        setHeaderMeta();renderPortfolios();renderOrders();resetSummary();
        if(!state.selectedUserId)return;
        try{await loadPortfolios(state.selectedUserId);}catch(err){showToast(err.message,true);}
      }

      async function onPortfolioChange(){
        const portfolioId=Number($("#portfolioSelect")?.value||0);
        state.selectedPortfolioId=portfolioId||null;
        const portfolio=selectedPortfolio();
        state.selectedPortfolioName=portfolio?.name||"";
        state.selectedPortfolio=portfolio||null;
        setHeaderMeta();renderOrders();renderSummary();
        if(!state.selectedPortfolioId)return;
        try{
          await loadOrders(state.selectedPortfolioId);
          state.selectedPortfolioName=selectedPortfolio()?.name||state.selectedPortfolioName;
          setHeaderMeta();
        }catch(err){showToast(err.message,true);}
      }

      async function onCreatePortfolio(){
        const input=$("#newPortfolioName");
        const name=String(input?.value||"").trim();
        if(!state.selectedUserId){showToast("Select a user first.",true);return;}
        if(!name){showToast("Enter a portfolio name.",true);return;}
        try{
          await createPortfolio(state.selectedUserId,name);
          input.value="";
          await loadPortfolios(state.selectedUserId);
          showToast("Portfolio created!");
        }catch(err){showToast(err.message,true);}
      }

      function buildOrderPayload(){
        if(!state.selectedPortfolioId)throw new Error("Select a portfolio first.");
        const symbol=String($("#symbolInput")?.value||"").trim().toUpperCase();
        const side=state.currentSide;
        const quantity=Number($("#quantityInput")?.value);
        const orderType=String($("#orderTypeSelect")?.value||"market").trim();
        const timeInForce=String($("#timeInForceSelect")?.value||"none").trim();
        const currentPrice=Number($("#currentPriceInput")?.value);
        const limitPriceRaw=$("#limitPriceInput")?.value;
        const stopPriceRaw=$("#stopPriceInput")?.value;
        const trailingPercentRaw=$("#trailingPercentInput")?.value;
        const eventRationale=state.currentRationale;
        const notes=String($("#orderNotesInput")?.value||"").trim();
        if(!DOW30[symbol])throw new Error("Symbol must be a Dow 30 ticker.");
        if(!Number.isFinite(quantity)||quantity<=0)throw new Error("Quantity must be > 0.");
        if(!Number.isFinite(currentPrice)||currentPrice<=0)throw new Error("Current Price must be > 0.");
        const payload={portfolio_id:Number(state.selectedPortfolioId),symbol,side,quantity,order_type:orderType,time_in_force:timeInForce,event_rationale:eventRationale||null,notes:notes||null,current_price:currentPrice};
        if(limitPriceRaw!=="")payload.limit_price=Number(limitPriceRaw);
        if(stopPriceRaw!=="")payload.stop_price=Number(stopPriceRaw);
        if(trailingPercentRaw!=="")payload.trailing_percent=Number(trailingPercentRaw);
        return payload;
      }

      async function onSubmitOrder(){
        try{
          const payload=buildOrderPayload();
          await submitOrder(payload);
          await loadOrders(state.selectedPortfolioId);
          clearOrderForm();
          showToast("Order submitted!");
          // Scroll to orders
          $("#ordersListMobile")?.scrollIntoView({behavior:"smooth",block:"start"});
        }catch(err){showToast(err.message,true);}
      }

      function clearOrderForm(){
        $("#quantityInput").value="";
        $("#currentPriceInput").value="";
        $("#limitPriceInput").value="";
        $("#stopPriceInput").value="";
        $("#trailingPercentInput").value="";
        $("#orderNotesInput").value="";
        // Reset rationale
        document.querySelectorAll(".port-rationale-chip").forEach(c=>c.classList.remove("selected"));
        document.querySelector('.port-rationale-chip[data-val=""]')?.classList.add("selected");
        state.currentRationale="";
        $("#eventRationaleSelect").value="";
      }

      /* ── WIRE UI ── */
      function wireEvents(){
        $("#userSelect")?.addEventListener("change",onUserChange);
        $("#portfolioSelect")?.addEventListener("change",onPortfolioChange);
        $("#createPortfolioBtn")?.addEventListener("click",onCreatePortfolio);
        $("#submitOrderBtn")?.addEventListener("click",onSubmitOrder);
        $("#symbolInput")?.addEventListener("input",resolveSymbolDisplay);
        $("#symbolInput")?.addEventListener("blur",resolveSymbolDisplay);

        // BUY/SELL toggle
        $("#sideBtn-buy")?.addEventListener("click",()=>{
          state.currentSide="buy";
          $("#sideSelect").value="buy";
          $("#sideBtn-buy").className="port-side-btn active-buy";
          $("#sideBtn-sell").className="port-side-btn";
        });

        $("#sideBtn-sell")?.addEventListener("click",()=>{
          state.currentSide="sell";
          $("#sideSelect").value="sell";
          $("#sideBtn-sell").className="port-side-btn active-sell";
          $("#sideBtn-buy").className="port-side-btn";
        });

        // Rationale chips
        document.querySelectorAll(".port-rationale-chip").forEach(chip=>{
          chip.addEventListener("click",()=>{
            document.querySelectorAll(".port-rationale-chip").forEach(c=>c.classList.remove("selected"));
            chip.classList.add("selected");
            state.currentRationale=chip.getAttribute("data-val")||"";
            $("#eventRationaleSelect").value=state.currentRationale;
          });
        });

        // Select None by default
        document.querySelector('.port-rationale-chip[data-val=""]')?.classList.add("selected");

        // Collapsible order section
        $("#orderSectionToggle")?.addEventListener("click",()=>{
          $("#orderSection")?.classList.toggle("collapsed");
        });
      }

      async function boot(){
        wireEvents();
        setHeaderMeta();
        resetSummary();
        resolveSymbolDisplay();
        try{await loadUsers();}catch(err){showToast(`Unable to load users: ${err.message}`,true);}
      }

      boot();
    </script>
  </body>
</html>
