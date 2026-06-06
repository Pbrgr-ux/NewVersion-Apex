/**
 * getDashboardData()
 *
 * Fetches all data needed for the Dashboard page (server-side).
 * Returns: perf, positions, classement, season info, all-time stats, indices.
 */

import { createClient }       from "@/lib/supabase/server"
import { createClient as createAdmin } from "@supabase/supabase-js"
import type { Database }      from "@/types/database"
import { TICKER_MAP }         from "@/lib/tickers"
import { getCurrentSeasonId, getCurrentSeasonData, getAllSeasonsData } from "@/lib/seasons"
import { getSaisonsNomMap }   from "@/lib/seasons-server"
import { getLiveQuotes }      from "@/lib/live-quotes"

function admin() {
  return createAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Types ─────────────────────────────────────────────────────
export type PositionRow = {
  ticker:         string
  name:           string
  allocation_pct: number
  open_price:     number | null   // prix moyen d'acquisition
  prix_actuel:    number | null
  variation_day:  number | null   // plus-value latente % (depuis l'acquisition)
  invested_eur:   number | null   // montant investi (base × alloc%)
  pnl_eur:        number | null   // plus-value latente en €
  sparkline:      number[]
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

export type LeaderRow = { pseudo: string; perf: number; rang: number; isSelf: boolean; avatar: string | null }

export type LeaderboardPreview = {
  top:       LeaderRow[]                              // top 3
  self:      LeaderRow | null                         // ma ligne (si hors top 3)
  toPass:    { pseudo: string; delta: number } | null // % pour dépasser le rang au-dessus
}

export type TradingStats = {
  bestTrade:   number | null
  worstTrade:  number | null
  winRate:     number | null
  tradesCount: number
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
  leaderboard:  LeaderboardPreview
  tradingStats: TradingStats | null
}

const EMPTY_LEADERBOARD: LeaderboardPreview = { top: [], self: null, toPass: null }

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

// ── Leaderboard preview (top 3 + ma position + écart au rang sup.) ─
async function getLeaderboardPreview(saisonId: number, userId: string): Promise<LeaderboardPreview> {
  const db = admin()
  const [usersRes, classRes] = await Promise.all([
    db.from("users").select("id, pseudo, avatar"),
    db.from("classement")
      .select("user_id, rang, perf_totale")
      .eq("saison", saisonId)
      .eq("statut_joueur", "confirmed")
      .order("perf_totale", { ascending: false }),
  ])

  const userOf = new Map<string, { pseudo: string; avatar: string | null }>()
  for (const u of usersRes.data ?? []) userOf.set(u.id, { pseudo: u.pseudo, avatar: (u as { avatar?: string | null }).avatar ?? null })

  const rows = (classRes.data ?? []).map((c, i) => ({
    user_id: c.user_id,
    pseudo:  userOf.get(c.user_id)?.pseudo ?? c.user_id,
    avatar:  userOf.get(c.user_id)?.avatar ?? null,
    perf:    c.perf_totale != null ? parseFloat(Number(c.perf_totale).toFixed(2)) : 0,
    rang:    i + 1,
    isSelf:  c.user_id === userId,
  }))

  if (rows.length === 0) return EMPTY_LEADERBOARD

  const top  = rows.slice(0, 3).map(({ pseudo, perf, rang, isSelf, avatar }) => ({ pseudo, perf, rang, isSelf, avatar }))
  const meIdx = rows.findIndex((r) => r.isSelf)
  const me    = meIdx >= 0 ? rows[meIdx] : null
  const self  = me && me.rang > 3 ? { pseudo: me.pseudo, perf: me.perf, rang: me.rang, isSelf: true, avatar: me.avatar } : null

  // Écart pour dépasser le joueur juste au-dessus
  let toPass: { pseudo: string; delta: number } | null = null
  if (me && meIdx > 0) {
    const above = rows[meIdx - 1]
    toPass = { pseudo: above.pseudo, delta: parseFloat((above.perf - me.perf).toFixed(2)) }
  }

  return { top, self, toPass }
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
    leaderboard:   EMPTY_LEADERBOARD,
    tradingStats:  null,
  }

  if (!user) return empty

  const leaderboard = await getLeaderboardPreview(CURRENT_SAISON, user.id)

  // ── 1. Portfolio + classement + all-time + indices (en parallèle) ─
  const [portfoliosRes, classementRes, totalRes, palmRes, lastIndice, nomMap] = await Promise.all([
    supabase
      .from("portfolios")
      .select("id, capital_ajuste, statut_joueur")
      .eq("user_id", user.id)
      .eq("saison", CURRENT_SAISON)
      .is("league_id", null)               // jeu principal uniquement
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
      // Variation composée (cohérente avec la richesse), pas une somme additive
      perf_totale_cumulee:  parseFloat(((perfs.reduce((acc, p) => acc * (1 + p / 100), 1) - 1) * 100).toFixed(2)),
    }
  }

  if (!portfoliosRes.data || portfoliosRes.data.length === 0) {
    return { ...empty, indices, allTime, leaderboard }
  }

  const portfolio = portfoliosRes.data[0]

  // Richesse all-time sans position courante = 100k × Π(saisons terminées)
  const wealthBase = palmRows.reduce((w, p) => w * (1 + Number(p.perf_totale) / 100), 100_000)

  // ── 2. Positions de la saison (ouvertes + fermées pour la perf chaînée) ─
  const { data: allPositions } = await supabase
    .from("positions")
    .select("ticker, allocation_pct, open_price, opened_at, close_price, status, base_capital")
    .eq("portfolio_id", portfolio.id)

  const openPositions = (allPositions ?? []).filter((p) => p.status === "open")

  if (openPositions.length === 0 && (allPositions ?? []).length === 0) {
    return {
      ...empty,
      hasPortfolio:  true,
      classement:    { rang: classementRes.data?.rang ?? null, total: totalRes.count ?? 0, statut_joueur: portfolio.statut_joueur ?? "confirmed" },
      capitalAjuste: Math.round(wealthBase),
      season:        seasonWithNom ?? seasonData,
      allTime,
      indices,
      leaderboard,
    }
  }

  // ── 3. Prix temps réel (lazy, ≤ 20 min) pour les positions ouvertes ─
  const openTickers = openPositions.map((p) => p.ticker)
  const liveQuotes   = await getLiveQuotes(openTickers)

  // Cours historiques (pour day/week/month des positions ouvertes)
  const { data: coursData } = openTickers.length > 0
    ? await supabase
        .from("cours")
        .select("ticker, prix, date")
        .in("ticker", openTickers)
        .order("date", { ascending: false })
        .limit(openTickers.length * 40)
    : { data: [] as { ticker: string; prix: number; date: string }[] }

  const pricesByTicker: Record<string, PricePoint[]> = {}
  for (const c of coursData ?? []) {
    if (!pricesByTicker[c.ticker]) pricesByTicker[c.ticker] = []
    pricesByTicker[c.ticker].push({ prix: Number(c.prix), date: c.date })
  }

  const d1  = isoNDaysAgo(1)
  const d7  = isoNDaysAgo(7)
  const d30 = isoNDaysAgo(30)

  let dayPerf = 0, weekPerf = 0, monthPerf = 0
  let hasDayData = false, hasWeekData = false, hasMonthData = false

  // ── 4. Positions affichées (ouvertes) valorisées au prix temps réel ─
  const positions: PositionRow[] = openPositions.map((pos) => {
    const prices    = pricesByTicker[pos.ticker] ?? []
    const w         = Number(pos.allocation_pct) / 100
    const live      = liveQuotes.get(pos.ticker) ?? (prices.length > 0 ? prices[0].prix : null)
    const openPrice = pos.open_price != null ? Number(pos.open_price) : null
    const p1        = priceOnOrBefore(prices, d1)
    const p7        = priceOnOrBefore(prices, d7)
    const p30       = priceOnOrBefore(prices, d30)

    const cDay    = safeContribution(live, p1,  w)
    const cWeek   = safeContribution(live, p7,  w)
    const cMonth  = safeContribution(live, p30, w)
    const sinceOpen = safeContribution(live, openPrice, w)  // depuis l'arbitrage

    if (cDay   != null) { dayPerf   += cDay;   hasDayData   = true }
    if (cWeek  != null) { weekPerf  += cWeek;  hasWeekData  = true }
    if (cMonth != null) { monthPerf += cMonth; hasMonthData = true }

    // Montants en € à partir de la base du batch
    const base        = pos.base_capital != null ? Number(pos.base_capital) : null
    const investedEur = base != null ? base * w : null
    const variationPct = sinceOpen != null && w > 0 ? sinceOpen / w : null
    const pnlEur      = investedEur != null && variationPct != null
      ? investedEur * (variationPct / 100)
      : null

    return {
      ticker:         pos.ticker,
      name:           TICKER_MAP[pos.ticker]?.name ?? pos.ticker,
      allocation_pct: Number(pos.allocation_pct),
      open_price:     openPrice,
      prix_actuel:    live,
      variation_day:  variationPct != null ? parseFloat(variationPct.toFixed(2)) : null,
      invested_eur:   investedEur != null ? Math.round(investedEur) : null,
      pnl_eur:        pnlEur != null ? Math.round(pnlEur) : null,
      sparkline:      prices.slice(0, 7).map((p) => p.prix).reverse(),
    }
  })

  // ── 5. Perf saison CHAÎNÉE : Π(1 + rendement de chaque arbitrage) − 1 ─
  // Chaque "batch" = positions ouvertes au même instant (opened_at).
  type PosRow = NonNullable<typeof allPositions>[number]
  const batches = new Map<string, PosRow[]>()
  for (const p of allPositions ?? []) {
    const key = p.opened_at ?? "—"
    if (!batches.has(key)) batches.set(key, [])
    batches.get(key)!.push(p)
  }

  let seasonFactor = 1
  let hasSeasonData = false
  for (const batch of batches.values()) {
    let batchReturn = 0
    let batchHas    = false
    for (const p of batch) {
      const w         = Number(p.allocation_pct) / 100
      const openPrice = p.open_price != null ? Number(p.open_price) : null
      // prix de fin : close_price si fermée, sinon prix temps réel
      const endPrice  = p.status === "closed"
        ? (p.close_price != null ? Number(p.close_price) : null)
        : (liveQuotes.get(p.ticker) ?? null)
      const c = safeContribution(endPrice, openPrice, w)
      if (c != null) { batchReturn += c; batchHas = true }
    }
    if (batchHas) { seasonFactor *= 1 + batchReturn / 100; hasSeasonData = true }
  }

  const seasonPerfLive = hasSeasonData
    ? parseFloat(((seasonFactor - 1) * 100).toFixed(2))
    : (classementRes.data?.perf_totale != null ? parseFloat(Number(classementRes.data.perf_totale).toFixed(2)) : null)

  // ── Stats de trading (chaque position = un trade) ────────────
  const tradeReturns: number[] = []
  for (const p of allPositions ?? []) {
    const open = p.open_price != null ? Number(p.open_price) : null
    const end  = p.status === "closed"
      ? (p.close_price != null ? Number(p.close_price) : null)
      : (liveQuotes.get(p.ticker) ?? null)
    if (open && open > 0 && end != null) {
      const ratio = end / open
      if (ratio <= 10 && ratio >= 0.1) tradeReturns.push((ratio - 1) * 100)
    }
  }
  const tradingStats: TradingStats = {
    bestTrade:   tradeReturns.length ? parseFloat(Math.max(...tradeReturns).toFixed(2)) : null,
    worstTrade:  tradeReturns.length ? parseFloat(Math.min(...tradeReturns).toFixed(2)) : null,
    winRate:     tradeReturns.length ? parseFloat(((tradeReturns.filter((r) => r > 0).length / tradeReturns.length) * 100).toFixed(0)) : null,
    tradesCount: tradeReturns.length,
  }

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
    // Capital = richesse all-time : [100k × Π(saisons terminées)] × (1 + perf saison)
    capitalAjuste: Math.round(wealthBase * (1 + (seasonPerfLive ?? 0) / 100)),
    allTime,
    indices,
    leaderboard,
    tradingStats,
  }
}
