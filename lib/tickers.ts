/**
 * Liste des 65 tickers autorisés dans APEX.
 * Source : spec produit v1.
 *
 * Chaque entrée expose deux symboles :
 *   ticker      — symbole interne utilisé dans la base de données (positions, cours)
 *   yahooSymbol — symbole Yahoo Finance pour l'appel API (peut différer pour les valeurs EU)
 *
 * Yahoo Finance couvre toutes les places :
 *   US   → symbole identique (AAPL, MSFT…)
 *   EU   → suffixe de place (.PA Paris · .DE Frankfurt · .AS Amsterdam · .SW Swiss…)
 *   ETF  → symbole US identique pour les ETFs US-listés
 */

export type Ticker = {
  ticker:      string                  // clé interne (DB)
  yahooSymbol: string                  // symbole Yahoo Finance
  name:        string
  region:      "US" | "Europe" | "ETF"
}

export const TICKERS: Ticker[] = [
  // ── Actions US ──────────────────────────────────────────────
  { ticker: "AAPL",  yahooSymbol: "AAPL",    name: "Apple",                region: "US" },
  { ticker: "MSFT",  yahooSymbol: "MSFT",    name: "Microsoft",             region: "US" },
  { ticker: "NVDA",  yahooSymbol: "NVDA",    name: "NVIDIA",                region: "US" },
  { ticker: "GOOGL", yahooSymbol: "GOOGL",   name: "Alphabet (Google)",     region: "US" },
  { ticker: "AMZN",  yahooSymbol: "AMZN",    name: "Amazon",                region: "US" },
  { ticker: "META",  yahooSymbol: "META",    name: "Meta Platforms",        region: "US" },
  { ticker: "BRK.B", yahooSymbol: "BRK-B",  name: "Berkshire Hathaway",   region: "US" },
  { ticker: "TSLA",  yahooSymbol: "TSLA",    name: "Tesla",                 region: "US" },
  { ticker: "AVGO",  yahooSymbol: "AVGO",    name: "Broadcom",              region: "US" },
  { ticker: "JPM",   yahooSymbol: "JPM",     name: "JPMorgan Chase",        region: "US" },
  { ticker: "LLY",   yahooSymbol: "LLY",     name: "Eli Lilly",             region: "US" },
  { ticker: "V",     yahooSymbol: "V",       name: "Visa",                  region: "US" },
  { ticker: "XOM",   yahooSymbol: "XOM",     name: "ExxonMobil",            region: "US" },
  { ticker: "UNH",   yahooSymbol: "UNH",     name: "UnitedHealth Group",    region: "US" },
  { ticker: "JNJ",   yahooSymbol: "JNJ",     name: "Johnson & Johnson",     region: "US" },
  { ticker: "WMT",   yahooSymbol: "WMT",     name: "Walmart",               region: "US" },
  { ticker: "MA",    yahooSymbol: "MA",      name: "Mastercard",            region: "US" },
  { ticker: "PG",    yahooSymbol: "PG",      name: "Procter & Gamble",      region: "US" },
  { ticker: "ORCL",  yahooSymbol: "ORCL",    name: "Oracle",                region: "US" },
  { ticker: "HD",    yahooSymbol: "HD",      name: "Home Depot",            region: "US" },
  { ticker: "COST",  yahooSymbol: "COST",    name: "Costco",                region: "US" },
  { ticker: "BAC",   yahooSymbol: "BAC",     name: "Bank of America",       region: "US" },
  { ticker: "NFLX",  yahooSymbol: "NFLX",    name: "Netflix",               region: "US" },
  { ticker: "CVX",   yahooSymbol: "CVX",     name: "Chevron",               region: "US" },
  { ticker: "CRM",   yahooSymbol: "CRM",     name: "Salesforce",            region: "US" },

  // ── Actions Europe ───────────────────────────────────────────
  // Suffixes : .PA=Paris · .DE=Frankfurt · .AS=Amsterdam
  //            .SW=Swiss  · .L=London    · .MC=Madrid
  { ticker: "MC",     yahooSymbol: "MC.PA",    name: "LVMH",                 region: "Europe" },
  { ticker: "NESN",   yahooSymbol: "NESN.SW",  name: "Nestlé",               region: "Europe" },
  { ticker: "ASML",   yahooSymbol: "ASML.AS",  name: "ASML Holding",         region: "Europe" },
  { ticker: "NOVO-B", yahooSymbol: "NOVO-B.CO",name: "Novo Nordisk",         region: "Europe" },
  { ticker: "ROG",    yahooSymbol: "ROG.SW",   name: "Roche Holding",        region: "Europe" },
  { ticker: "SAP",    yahooSymbol: "SAP.DE",   name: "SAP SE",               region: "Europe" },
  { ticker: "NOVN",   yahooSymbol: "NOVN.SW",  name: "Novartis",             region: "Europe" },
  { ticker: "AZN",    yahooSymbol: "AZN.L",    name: "AstraZeneca",          region: "Europe" },
  { ticker: "RMS",    yahooSymbol: "RMS.PA",   name: "Hermès International", region: "Europe" },
  { ticker: "SHEL",   yahooSymbol: "SHEL.L",   name: "Shell",                region: "Europe" },
  { ticker: "TTE",    yahooSymbol: "TTE.PA",   name: "TotalEnergies",        region: "Europe" },
  { ticker: "SIE",    yahooSymbol: "SIE.DE",   name: "Siemens",              region: "Europe" },
  { ticker: "SU",     yahooSymbol: "SU.PA",    name: "Schneider Electric",   region: "Europe" },
  { ticker: "OR",     yahooSymbol: "OR.PA",    name: "L'Oréal",              region: "Europe" },
  { ticker: "SAN",    yahooSymbol: "SAN.PA",   name: "Sanofi",               region: "Europe" },
  { ticker: "ULVR",   yahooSymbol: "ULVR.L",   name: "Unilever",             region: "Europe" },
  { ticker: "HSBA",   yahooSymbol: "HSBA.L",   name: "HSBC Holdings",        region: "Europe" },
  { ticker: "AIR",    yahooSymbol: "AIR.PA",   name: "Airbus",               region: "Europe" },
  { ticker: "ALV",    yahooSymbol: "ALV.DE",   name: "Allianz",              region: "Europe" },
  { ticker: "ITX",    yahooSymbol: "ITX.MC",   name: "Inditex",              region: "Europe" },
  { ticker: "IBE",    yahooSymbol: "IBE.MC",   name: "Iberdrola",            region: "Europe" },
  { ticker: "ABBN",   yahooSymbol: "ABBN.SW",  name: "ABB",                  region: "Europe" },
  { ticker: "BNP",    yahooSymbol: "BNP.PA",   name: "BNP Paribas",          region: "Europe" },
  { ticker: "CFR",    yahooSymbol: "CFR.SW",   name: "Richemont",            region: "Europe" },
  { ticker: "MUV2",   yahooSymbol: "MUV2.DE",  name: "Munich Re",            region: "Europe" },

  // ── ETFs ─────────────────────────────────────────────────────
  { ticker: "SPY",   yahooSymbol: "SPY",     name: "SPDR S&P 500 ETF",              region: "ETF" },
  { ticker: "IVV",   yahooSymbol: "IVV",     name: "iShares Core S&P 500",          region: "ETF" },
  { ticker: "VOO",   yahooSymbol: "VOO",     name: "Vanguard S&P 500",              region: "ETF" },
  { ticker: "QQQ",   yahooSymbol: "QQQ",     name: "Invesco QQQ (Nasdaq-100)",       region: "ETF" },
  { ticker: "VTI",   yahooSymbol: "VTI",     name: "Vanguard Total Stock Market",   region: "ETF" },
  { ticker: "SOXX",  yahooSymbol: "SOXX",    name: "iShares Semiconductor",         region: "ETF" },
  { ticker: "XLF",   yahooSymbol: "XLF",     name: "Financial Select SPDR",         region: "ETF" },
  { ticker: "XLV",   yahooSymbol: "XLV",     name: "Health Care Select SPDR",       region: "ETF" },
  { ticker: "VGK",   yahooSymbol: "VGK",     name: "Vanguard FTSE Europe",          region: "ETF" },
  { ticker: "URTH",  yahooSymbol: "URTH",    name: "iShares MSCI World",            region: "ETF" },
  { ticker: "IEMG",  yahooSymbol: "IEMG",    name: "iShares Core MSCI Emerging Markets", region: "ETF" },
  { ticker: "LCUW",  yahooSymbol: "CW8.PA",  name: "Amundi MSCI World UCITS",       region: "ETF" },
  { ticker: "500",   yahooSymbol: "500.PA",  name: "Amundi S&P 500 UCITS",          region: "ETF" },
  { ticker: "BND",   yahooSymbol: "BND",     name: "Vanguard Total Bond Market",    region: "ETF" },
  { ticker: "IAU",   yahooSymbol: "IAU",     name: "iShares Gold Trust",            region: "ETF" },
]

export const TICKER_MAP = Object.fromEntries(
  TICKERS.map((t) => [t.ticker, t])
) as Record<string, Ticker>

/** Map inverse : yahooSymbol → ticker interne */
export const YAHOO_TO_TICKER = Object.fromEntries(
  TICKERS.map((t) => [t.yahooSymbol, t.ticker])
) as Record<string, string>
