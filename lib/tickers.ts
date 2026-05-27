/**
 * Liste des 65 tickers autorisés dans APEX.
 * Source : spec produit v1.
 *
 * Nota Bene — tickers européens :
 * Polygon.io couvre bien les valeurs US. Pour les valeurs
 * européennes, l'endpoint /prev renvoie les données OTC
 * (ex. ASML, SAP, AZN s'échangent aussi sur NYSE/Nasdaq).
 * Les tickers purement locaux (MC, NESN, ROG…) peuvent
 * retourner null → ils sont ignorés sans planter le cron.
 */

export type Ticker = {
  ticker: string
  name:   string
  region: "US" | "Europe" | "ETF"
}

export const TICKERS: Ticker[] = [
  // ── Actions US ──────────────────────────────────────────────
  { ticker: "AAPL",   name: "Apple",                region: "US" },
  { ticker: "MSFT",   name: "Microsoft",             region: "US" },
  { ticker: "NVDA",   name: "NVIDIA",                region: "US" },
  { ticker: "GOOGL",  name: "Alphabet (Google)",     region: "US" },
  { ticker: "AMZN",   name: "Amazon",                region: "US" },
  { ticker: "META",   name: "Meta Platforms",        region: "US" },
  { ticker: "BRK.B",  name: "Berkshire Hathaway",   region: "US" },
  { ticker: "TSLA",   name: "Tesla",                 region: "US" },
  { ticker: "AVGO",   name: "Broadcom",              region: "US" },
  { ticker: "JPM",    name: "JPMorgan Chase",        region: "US" },
  { ticker: "LLY",    name: "Eli Lilly",             region: "US" },
  { ticker: "V",      name: "Visa",                  region: "US" },
  { ticker: "XOM",    name: "ExxonMobil",            region: "US" },
  { ticker: "UNH",    name: "UnitedHealth Group",    region: "US" },
  { ticker: "JNJ",    name: "Johnson & Johnson",     region: "US" },
  { ticker: "WMT",    name: "Walmart",               region: "US" },
  { ticker: "MA",     name: "Mastercard",            region: "US" },
  { ticker: "PG",     name: "Procter & Gamble",      region: "US" },
  { ticker: "ORCL",   name: "Oracle",                region: "US" },
  { ticker: "HD",     name: "Home Depot",            region: "US" },
  { ticker: "COST",   name: "Costco",                region: "US" },
  { ticker: "BAC",    name: "Bank of America",       region: "US" },
  { ticker: "NFLX",   name: "Netflix",               region: "US" },
  { ticker: "CVX",    name: "Chevron",               region: "US" },
  { ticker: "CRM",    name: "Salesforce",            region: "US" },

  // ── Actions Europe (cotations US / OTC via Polygon) ─────────
  { ticker: "MC",     name: "LVMH",                  region: "Europe" },
  { ticker: "NESN",   name: "Nestlé",                region: "Europe" },
  { ticker: "ASML",   name: "ASML Holding",          region: "Europe" },
  { ticker: "NOVO-B", name: "Novo Nordisk",          region: "Europe" },
  { ticker: "ROG",    name: "Roche Holding",         region: "Europe" },
  { ticker: "SAP",    name: "SAP SE",                region: "Europe" },
  { ticker: "NOVN",   name: "Novartis",              region: "Europe" },
  { ticker: "AZN",    name: "AstraZeneca",           region: "Europe" },
  { ticker: "RMS",    name: "Hermès International",  region: "Europe" },
  { ticker: "SHEL",   name: "Shell",                 region: "Europe" },
  { ticker: "TTE",    name: "TotalEnergies",         region: "Europe" },
  { ticker: "SIE",    name: "Siemens",               region: "Europe" },
  { ticker: "SU",     name: "Schneider Electric",    region: "Europe" },
  { ticker: "OR",     name: "L'Oréal",               region: "Europe" },
  { ticker: "SAN",    name: "Sanofi",                region: "Europe" },
  { ticker: "ULVR",   name: "Unilever",              region: "Europe" },
  { ticker: "HSBA",   name: "HSBC Holdings",         region: "Europe" },
  { ticker: "AIR",    name: "Airbus",                region: "Europe" },
  { ticker: "ALV",    name: "Allianz",               region: "Europe" },
  { ticker: "ITX",    name: "Inditex",               region: "Europe" },
  { ticker: "IBE",    name: "Iberdrola",             region: "Europe" },
  { ticker: "ABBN",   name: "ABB",                   region: "Europe" },
  { ticker: "BNP",    name: "BNP Paribas",           region: "Europe" },
  { ticker: "CFR",    name: "Richemont",             region: "Europe" },
  { ticker: "MUV2",   name: "Munich Re",             region: "Europe" },

  // ── ETFs ────────────────────────────────────────────────────
  { ticker: "SPY",    name: "SPDR S&P 500 ETF",      region: "ETF" },
  { ticker: "IVV",    name: "iShares Core S&P 500",  region: "ETF" },
  { ticker: "VOO",    name: "Vanguard S&P 500",      region: "ETF" },
  { ticker: "QQQ",    name: "Invesco QQQ (Nasdaq-100)", region: "ETF" },
  { ticker: "VTI",    name: "Vanguard Total Stock Market", region: "ETF" },
  { ticker: "SOXX",   name: "iShares Semiconductor", region: "ETF" },
  { ticker: "XLF",    name: "Financial Select SPDR", region: "ETF" },
  { ticker: "XLV",    name: "Health Care Select SPDR", region: "ETF" },
  { ticker: "VGK",    name: "Vanguard FTSE Europe",  region: "ETF" },
  { ticker: "URTH",   name: "iShares MSCI World",    region: "ETF" },
  { ticker: "IEMG",   name: "iShares Core MSCI Emerging Markets", region: "ETF" },
  { ticker: "LCUW",   name: "Amundi MSCI World UCITS", region: "ETF" },
  { ticker: "500",    name: "Amundi S&P 500 UCITS",  region: "ETF" },
  { ticker: "BND",    name: "Vanguard Total Bond Market", region: "ETF" },
  { ticker: "IAU",    name: "iShares Gold Trust",    region: "ETF" },
]

export const TICKER_MAP = Object.fromEntries(
  TICKERS.map((t) => [t.ticker, t])
) as Record<string, Ticker>
