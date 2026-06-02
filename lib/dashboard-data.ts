/**
 * getDashboardData()
 *
 * Fetches all data needed for the Dashboard page (server-side).
 * Returns: perf, positions, classement, season info, all-time stats, indices.
 */

import { createClient } from "@/lib/supabase/server"
import { TICKER_MAP }   from "@/lib/tickers"
import { getCurrentSeasonId, getCurrentSeasonData, getAllSeasonsData } from "@/lib/seasons"
import { getSaisonsNomMap } from "@/lib/seasons-server"

// ── Types ─────────────────────────────────────────────────────
export type PositionRow = {
  ticker:        string
  name:          string
  allocation_pct: number
  prix_actuel:   number | null
  variation_day: number | null
  sparkline:     number[]
}

export type AllTimeStats = {
  nb_saisons:            number
  meilleur_rang:         number | null
  meilleur_rang_saison:  string | null
  alpha_moyen:           number | null
  top10_count:           number
  win_rate:              number | null
  perf_totale_cumulee:   number
}

export type IndicesData = {
  cac40_variation:  number | null
  sp500_variation:  number | null
  cac40_prix:       number | null
  sp500_prix:       number | null
}

export type DashboardData = {
  hasPortfolio: boolean
  perf: {
    day:    number | null
    week:   number | null
    month:  number | null
    season: number | null
  }
  positions:    PositionRow[]
  classement:   { rang: number | null; total: number; statut_joueur: string }
  season:       ReturnType<typeof getCurrentSeasonData>
  capitalAjuste: number | null
  allTime:      AllTimeStats | null
  indices:      IndicesData
}

// ── Helpers ───────────────────────────────────────────────────
function isoNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split("T")[0]
}

type PricePoint = { prix: number; date: string }

function priceOnOrBefore(prices: PricePoint[], targetDate: string): number | null {
  const found = prices.find((p) => p.date <= targetDate)
  return found != null ? found.prix : null
}

/**
 * Variation pondérée d'une position, avec garde anti-données-corrompues.
 * Un ratio hors [0.1, 10] (≈ ±900%) sur jour/semaine/mois est impossible
 * pour une action réelle → donnée erronée, contribution ignorée.
 */
function safeContribution(current: number | null, past: number | null, weight: number): number | null {
  if (current == null || past == null || past <= 0) return null
  const ratio = current / past
  if (ratio > 10 || ratio < 0.1) return null   // donnée aberrante
  return weight * (ratio - 1) * 100
}

// ── Fetch principal ───────────────────────────────────────────
export async function getDashboardData(): Promise<DashboardData> {
  const supabase       = await createClient()
  const CURRENT_SAISON = getCurrentSeasonId()
  const seasonData     = getCurrentSeasonData()

  const { data: { user } } = await supabase.auth.getUser()

  const empty: DashboardData = {
    hasPortfolio:  false,
    perf:          { day: null, week: null, month: null, season: null },
    positions:     [],
    classement:    { rang: null, total: 0, statut_joueur: "confirmed" },
    season:        seasonData,   // sera surchargé après fetch des noms
    capitalAjuste: null,
    allTime:       null,
    indices:       { cac40_variation: null, sp500_variation: null, cac40_prix: null, sp500_prix: null },
  }

  if (!user) return empty

  // ── 1. Portfolio + classement + all-time + indices (en parallèle) ─
  const [portfoliosRes, classementRes, totalRes, palmRes, lastIndice, nomMap] = await Promise.all([
    supabase
      .from("portfolios")
      .select("id, capital_ajuste, statut_joueur, positions ( ticker, allocation_pct, prix_achat )")
      .eq("user_id", user.id)
      .eq("saison", CURRENT_SAISON)
      .order("id", { ascending: false }),

    supabase
      .from("classement")
      .select("rang, perf_totale, statut_joueur")
      .eq("user_id", user.id)
      .eq("saison", CURRENT_SAISON)
      .maybeSingle(),

    supabase
      .from("classement")
      .select("id", { count: "exact", head: true })
      .eq("saison", CURRENT_SAISON)
      .eq("statut_joueur", "confirmed"),

    // All-time : palmares de l'utilisateur
    supabase
      .from("palmares_all_time")
      .select("rang_final, perf_totale, top10, saison_id")
      .eq("user_id", user.id)
      .order("saison_id", { ascending: false }),

    // Dernier indice connu
    supabase
      .from("indices")
      .select("cac40_variation_saison, sp500_variation_saison, cac40_prix, sp500_prix")
      .eq("saison_id", CURRENT_SAISON)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Noms des saisons depuis la table saisons
    getSaisonsNomMap(),
  ])

  // ── Nom de la saison depuis DB (override du label calculé) ───
  const seasonNom = nomMap?.get(CURRENT_SAISON)
  const seasonWithNom = seasonNom
    ? { ...seasonData, label: seasonNom }
    : seasonData

  // ── Indices ───────────────────────────────────────────────────
  const indices: IndicesData = {
    cac40_variation: lastIndice.data?.cac40_variation_saison ?? null,
    sp500_variation: lastIndice.data?.sp500_variation_saison ?? null,
    cac40_prix:      lastIndice.data?.cac40_prix             ?? null,
    sp500_prix:      lastIndice.data?.sp500_prix             ?? null,
  }

  // ── All-Time ──────────────────────────────────────────────────
  let allTime: AllTimeStats | null = null
  const palmRows = palmRes.data ?? []
  if (palmRows.length > 0) {
    const perfs      = palmRows.map((r) => Number(r.perf_totale))
    const rang_final = palmRows.map((r) => r.rang_final).filter(Boolean) as number[]
    const bestRang   = rang_final.length > 0 ? Math.min(...rang_final) : null
    const bestSaison = bestRang != null
      ? palmRows.find((r) => r.rang_final === bestRang)
      : null

    allTime = {
      nb_saisons:           palmRows.length,
      meilleur_rang:        bestRang,
      meilleur_rang_saison: bestSaison ? (nomMap?.get(bestSaison.saison_id) ?? `S${bestSaison.saison_id}`) : null,
      alpha_moyen:          perfs.length > 0 ? parseFloat((perfs.reduce((a, b) => a + b, 0) / perfs.length).toFixed(2)) : null,
      top10_count:          palmRows.filter((r) => r.top10).length,
      win_rate:             perfs.length > 0 ? parseFloat(((perfs.filter((p) => p > 0).length / perfs.length) * 100).toFixed(1)) : null,
      perf_totale_cumulee:  parseFloat(perfs.reduce((a, b) => a + b, 0).toFixed(2)),
    }
  }

  if (!portfoliosRes.data || portfoliosRes.data.length === 0) {
    return { ...empty, indices, allTime }
  }

  const portfolio = portfoliosRes.data[0]
  type RawPosition = { ticker: string; allocation_pct: number; prix_achat: number }
  const rawPositions = (portfolio.positions ?? []) as RawPosition[]

  // Richesse all-time sans position courante = 100k × Π(saisons terminées)
  const wealthBase = palmRows.reduce((w, p) => w * (1 + Number(p.perf_totale) / 100), 100_000)

  if (rawPositions.length === 0) {
    return {
      ...empty,
      hasPortfolio:  true,
      classement:    { rang: classementRes.data?.rang ?? null, total: totalRes.count ?? 0, statut_joueur: portfolio.statut_joueur ?? "confirmed" },
      capitalAjuste: Math.round(wealthBase),
      season:        seasonWithNom ?? seasonData,
      allTime,
      indices,
    }
  }

  const tickers = rawPositions.map((p) => p.ticker)

  // ── 2. Cours ─────────────────────────────────────────────────
  const { data: coursData } = await supabase
    .from("cours")
    .select("ticker, prix, date")
    .in("ticker", tickers)
    .order("date", { ascending: false })
    .limit(tickers.length * 40)

  const pricesByTicker: Record<string, PricePoint[]> = {}
  for (const c of coursData ?? []) {
    if (!pricesByTicker[c.ticker]) pricesByTicker[c.ticker] = []
    pricesByTicker[c.ticker].push({ prix: Number(c.prix), date: c.date })
  }

  const d1  = isoNDaysAgo(1)
  const d7  = isoNDaysAgo(7)
  const d30 = isoNDaysAgo(30)

  let dayPerf = 0, weekPerf = 0, monthPerf = 0, seasonPerf = 0
  let hasDayData = false, hasWeekData = false, hasMonthData = false, hasSeasonData = false

  const positions: PositionRow[] = rawPositions.map((pos) => {
    const prices    = pricesByTicker[pos.ticker] ?? []
    const w         = Number(pos.allocation_pct) / 100
    const pCurrent  = prices.length > 0 ? prices[0].prix : null
    const p1        = priceOnOrBefore(prices, d1)
    const p7        = priceOnOrBefore(prices, d7)
    const p30       = priceOnOrBefore(prices, d30)
    const prixAchat = Number(pos.prix_achat)

    const cDay    = safeContribution(pCurrent, p1,        w)
    const cWeek   = safeContribution(pCurrent, p7,        w)
    const cMonth  = safeContribution(pCurrent, p30,       w)
    const cSeason = safeContribution(pCurrent, prixAchat, w)

    if (cDay    != null) { dayPerf    += cDay;    hasDayData    = true }
    if (cWeek   != null) { weekPerf   += cWeek;   hasWeekData   = true }
    if (cMonth  != null) { monthPerf  += cMonth;  hasMonthData  = true }
    if (cSeason != null) { seasonPerf += cSeason; hasSeasonData = true }

    return {
      ticker:         pos.ticker,
      name:           TICKER_MAP[pos.ticker]?.name ?? pos.ticker,
      allocation_pct: Number(pos.allocation_pct),
      prix_actuel:    pCurrent,
      // Variation depuis le dernier arbitrage (cours actuel vs prix_achat)
      variation_day:  cSeason != null && w > 0 ? parseFloat((cSeason / w).toFixed(2)) : null,
      sparkline:      prices.slice(0, 7).map((p) => p.prix).reverse(),
    }
  })

  // Perf saison live (depuis prix_achat), fallback sur le classement cron
  const seasonPerfLive = hasSeasonData
    ? parseFloat(seasonPerf.toFixed(2))
    : (classementRes.data?.perf_totale != null ? parseFloat(Number(classementRes.data.perf_totale).toFixed(2)) : null)

  return {
    hasPortfolio:  true,
    perf: {
      day:    hasDayData   ? parseFloat(dayPerf.toFixed(2))   : null,
      week:   hasWeekData  ? parseFloat(weekPerf.toFixed(2))  : null,
      month:  hasMonthData ? parseFloat(monthPerf.toFixed(2)) : null,
      season: seasonPerfLive,
    },
    positions,
    classement: {
      rang:          classementRes.data?.rang ?? null,
      total:         totalRes.count ?? 0,
      statut_joueur: classementRes.data?.statut_joueur ?? portfolio.statut_joueur ?? "confirmed",
    },
    season:        seasonWithNom ?? seasonData,
    // Capital = richesse all-time cumulée (jamais remise à 100k) :
    // [100 000 € × Π(saisons terminées)] × (1 + perf saison courante)
    capitalAjuste: Math.round(wealthBase * (1 + (seasonPerfLive ?? 0) / 100)),
    allTime,
    indices,
  }
}
