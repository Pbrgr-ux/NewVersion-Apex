/**
 * lib/stock-detail.ts  (SERVER-ONLY)
 *
 * Fiche action : historique 6 mois + ratios clés (Yahoo Finance).
 */

import { TICKER_MAP }                    from "@/lib/tickers"
import { fetchHistory, fetchKeyStats }   from "@/lib/yahoo-finance"
import type { PricePoint, StockStats }   from "@/lib/yahoo-finance"
import { getTickerCrowd }                from "@/lib/pulse-data"

export type StockDetail = {
  ticker:   string
  name:     string
  region:   string
  history:  PricePoint[]
  stats:    StockStats
  crowd:    { holdersPct: number; avgAllocation: number; totalPlayers: number } | null
}

export async function getStockDetail(ticker: string): Promise<StockDetail | null> {
  const meta = TICKER_MAP[ticker]
  if (!meta) return null

  const [history, stats, crowd] = await Promise.all([
    fetchHistory(meta.yahooSymbol),
    fetchKeyStats(meta.yahooSymbol),
    getTickerCrowd(ticker),
  ])

  return {
    ticker,
    name:    meta.name,
    region:  meta.region,
    history,
    stats,
    crowd,
  }
}
