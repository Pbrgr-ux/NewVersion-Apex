/**
 * lib/pulse-data.ts  (SERVER-ONLY)
 *
 * "Pulse" = positionnement agrégé et anonyme de la communauté sur la Major League.
 * Pour chaque action : part des joueurs qui la détiennent + allocation moyenne.
 * Donnée native (aucune source externe), calculée depuis la table positions.
 */

import { createClient }       from "@supabase/supabase-js"
import type { Database }      from "@/types/database"
import { getCurrentSeasonId } from "@/lib/seasons"
import { TICKER_MAP }         from "@/lib/tickers"

function admin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type PulseRow = {
  ticker:        string
  name:          string
  holders:       number
  holdersPct:    number   // % des joueurs positionnés qui détiennent cette action
  avgAllocation: number   // allocation moyenne parmi les détenteurs (%)
}

export type PulseData = {
  totalPlayers: number    // nb de joueurs ayant ≥ 1 position ouverte (Major League)
  rows:         PulseRow[]
}

/** Positions ouvertes du jeu principal (saison courante), anonymisées. */
async function openPositions() {
  const db = admin()
  const { data } = await db
    .from("positions")
    .select("user_id, ticker, allocation_pct, status, saison, league_id")
    .eq("saison", getCurrentSeasonId())
    .is("league_id", null)
    .eq("status", "open")
  return (data ?? []).filter((p) => p.user_id)
}

export async function getPulseData(): Promise<PulseData> {
  const positions = await openPositions()

  const players = new Set<string>()
  const byTicker = new Map<string, { holders: Set<string>; sumAlloc: number }>()
  for (const p of positions) {
    players.add(p.user_id!)
    if (!byTicker.has(p.ticker)) byTicker.set(p.ticker, { holders: new Set(), sumAlloc: 0 })
    const t = byTicker.get(p.ticker)!
    t.holders.add(p.user_id!)
    t.sumAlloc += Number(p.allocation_pct)
  }

  const totalPlayers = players.size
  const rows: PulseRow[] = [...byTicker.entries()]
    .map(([ticker, t]) => ({
      ticker,
      name:          TICKER_MAP[ticker]?.name ?? ticker,
      holders:       t.holders.size,
      holdersPct:    totalPlayers > 0 ? Math.round((t.holders.size / totalPlayers) * 100) : 0,
      avgAllocation: parseFloat((t.sumAlloc / t.holders.size).toFixed(1)),
    }))
    .sort((a, b) => b.holders - a.holders || b.avgAllocation - a.avgAllocation)

  return { totalPlayers, rows }
}

/** Positionnement de la foule sur une action précise (fiche action). */
export async function getTickerCrowd(ticker: string): Promise<{ holdersPct: number; avgAllocation: number; totalPlayers: number } | null> {
  const positions = await openPositions()
  if (positions.length === 0) return null

  const players = new Set<string>()
  const holders = new Set<string>()
  let sumAlloc = 0
  for (const p of positions) {
    players.add(p.user_id!)
    if (p.ticker === ticker) { holders.add(p.user_id!); sumAlloc += Number(p.allocation_pct) }
  }
  const totalPlayers = players.size
  return {
    totalPlayers,
    holdersPct:    totalPlayers > 0 ? Math.round((holders.size / totalPlayers) * 100) : 0,
    avgAllocation: holders.size > 0 ? parseFloat((sumAlloc / holders.size).toFixed(1)) : 0,
  }
}
