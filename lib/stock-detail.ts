/**
 * lib/stock-detail.ts  (SERVER-ONLY)
 *
 * Fiche action : historique 6 mois + ratios clés (Yahoo Finance).
 */

import { TICKER_MAP }                    from "@/lib/tickers"
import { fetchHistory, fetchKeyStats }   from "@/lib/yahoo-finance"
import type { PricePoint, StockStats }   from "@/lib/yahoo-finance"

export type StockDetail = {
  ticker:   string
  name:     string
  region:   string
  history:  PricePoint[]
  stats:    StockStats
}

export async function getStockDetail(ticker: string): Promise<StockDetail | null> {
  const meta = TICKER_MAP[ticker]
  if (!meta) return null

  const [history, stats] = await Promise.all([
    fetchHistory(meta.yahooSymbol, "6mo"),
    fetchKeyStats(meta.yahooSymbol),
  ])

  return {
    ticker,
    name:    meta.name,
    region:  meta.region,
    history,
    stats,
  }
}
