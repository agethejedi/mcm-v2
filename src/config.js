export const SYMBOLS = [
  { symbol: "MSFT", name: "Microsoft",        threshold: 0.005, category: "Mega-cap Liquidity Leader", cohort: "liquidity_leader" },
  { symbol: "CRM",  name: "Salesforce",       threshold: 0.010, category: "Enterprise Software / IT Budgets", cohort: "reflex_bounce" },
  { symbol: "JPM",  name: "JPMorgan",         threshold: 0.008, category: "Cyclical Financials", cohort: "macro_sensitive" },
  { symbol: "AXP",  name: "American Express", threshold: 0.012, category: "Payments / Affluent Spend", cohort: "macro_sensitive" },
  { symbol: "NKE",  name: "Nike",             threshold: 0.010, category: "Consumer Discretionary", cohort: "macro_sensitive" },
  { symbol: "IBM",  name: "IBM",              threshold: 0.007, category: "Value Tech / Rebalancing", cohort: "liquidity_leader" }
];

// Dow 30 (Periodic Table home page)
// NOTE: Dow membership can change over time; keep this list curated as needed.
export const DOW30 = [
  { symbol: "AAPL", name: "Apple", threshold: 0.006, category: "Mega-cap Liquidity Leader", cohort: "liquidity_leader" },
  { symbol: "MSFT", name: "Microsoft", threshold: 0.005, category: "Mega-cap Liquidity Leader", cohort: "liquidity_leader" },
  { symbol: "IBM", name: "IBM", threshold: 0.007, category: "Value Tech / Rebalancing", cohort: "liquidity_leader" },

  { symbol: "CRM", name: "Salesforce", threshold: 0.010, category: "Enterprise Software / IT Budgets", cohort: "reflex_bounce" },
  { symbol: "INTC", name: "Intel", threshold: 0.010, category: "Semis / Cycle", cohort: "reflex_bounce" },
  { symbol: "NKE", name: "Nike", threshold: 0.010, category: "Consumer Discretionary", cohort: "reflex_bounce" },

  { symbol: "JPM", name: "JPMorgan", threshold: 0.008, category: "Cyclical Financials", cohort: "macro_sensitive" },
  { symbol: "AXP", name: "American Express", threshold: 0.012, category: "Payments / Affluent Spend", cohort: "macro_sensitive" },
  { symbol: "V", name: "Visa", threshold: 0.010, category: "Payments / Spending", cohort: "macro_sensitive" },
  { symbol: "GS", name: "Goldman Sachs", threshold: 0.010, category: "Capital Markets", cohort: "macro_sensitive" },
  { symbol: "HD", name: "Home Depot", threshold: 0.010, category: "Housing / Consumer", cohort: "macro_sensitive" },
  { symbol: "DIS", name: "Disney", threshold: 0.012, category: "Consumer / Media", cohort: "macro_sensitive" },
  { symbol: "WMT", name: "Walmart", threshold: 0.007, category: "Consumer Staples / Scale", cohort: "macro_sensitive" },
  { symbol: "CVX", name: "Chevron", threshold: 0.010, category: "Energy / Macro", cohort: "macro_sensitive" },

  { symbol: "CAT", name: "Caterpillar", threshold: 0.010, category: "Industrials / Capex", cohort: "cyclical" },
  { symbol: "HON", name: "Honeywell", threshold: 0.008, category: "Industrials / Aerospace", cohort: "cyclical" },
  { symbol: "BA", name: "Boeing", threshold: 0.014, category: "Aerospace", cohort: "cyclical" },
  { symbol: "MMM", name: "3M", threshold: 0.010, category: "Industrials", cohort: "cyclical" },
  { symbol: "DOW", name: "Dow Inc.", threshold: 0.012, category: "Chemicals", cohort: "cyclical" },

  { symbol: "JNJ", name: "Johnson & Johnson", threshold: 0.006, category: "Defensive / Healthcare", cohort: "defensive" },
  { symbol: "MRK", name: "Merck", threshold: 0.006, category: "Defensive / Healthcare", cohort: "defensive" },
  { symbol: "AMGN", name: "Amgen", threshold: 0.007, category: "Defensive / Biotech", cohort: "defensive" },
  { symbol: "UNH", name: "UnitedHealth", threshold: 0.007, category: "Defensive / Healthcare", cohort: "defensive" },
  { symbol: "PG", name: "Procter & Gamble", threshold: 0.006, category: "Defensive / Staples", cohort: "defensive" },
  { symbol: "KO", name: "Coca-Cola", threshold: 0.006, category: "Defensive / Staples", cohort: "defensive" },
  { symbol: "MCD", name: "McDonald's", threshold: 0.007, category: "Defensive / Consumer", cohort: "defensive" },
  { symbol: "VZ", name: "Verizon", threshold: 0.006, category: "Defensive / Yield", cohort: "defensive" },
  { symbol: "TRV", name: "Travelers", threshold: 0.007, category: "Defensive / Insurance", cohort: "defensive" },
  { symbol: "CSCO", name: "Cisco", threshold: 0.007, category: "Defensive / Networking", cohort: "defensive" }
];

export const DAYS_TO_TRACK = 10;

// UI refresh from backend cache (safe)
export const UI_REFRESH_MS = 30_000;
