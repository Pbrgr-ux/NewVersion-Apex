/**
 * getDashboardData()
 *
 * Fetches all data needed for the Dashboard page (server-side).
 * Called from app/dashboard/page.tsx (Server Component).
 *
 * Returns:
 *  - perf du jour / semaine / mois  (pondérés par allocation)
 *  - positions avec cours actuel + variation jour + sparkline
 *  - rang classement + total joueurs
 */

import { createClient } from "@/lib/supabase/server"
import { TICKER_MAP }   from "@/lib/tickers"

const CURRENT_SAISON = 1

// ── Types publics (utilisés par le composant) ─────────────────
export type PositionRow = {
  ticker:        string
  name:          string
  allocation_pct: number
  prix_actuel:   number | null   // cours le plus récent
  variation_day: number | null   // % vs clôture précédente
  sparkline:     number[]        // 7 dernières clôtures, du plus ancien au plus récent
}

export type DashboardData = {
  hasPortfolio: boolean
  perf: {
    day:    number | null   // % pondéré par allocation
    week:   number | null
    month:  number | null
    season: number | null   // perf_totale depuis classement
  }
  positions:   PositionRow[]
  classement:  { rang: number | null; total: number }
}

// ── Helpers ───────────────────────────────────────────────────
function isoNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split("T")[0]
}

type PricePoint = { prix: number; date: string }

/** Prix le plus récent dont la date est ≤ targetDate (prices triés DESC). */
function priceOnOrBefore(prices: PricePoint[], targetDate: string): number | null {
  const found = prices.find((p) => p.date <= targetDate)
  return found != null ? found.prix : null
}

// ── Fetch principal ───────────────────────────────────────────
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const empty: DashboardData = {
    hasPortfolio: false,
    perf:         { day: null, week: null, month: null, season: null },
    positions:    [],
    classement:   { rang: null, total: 0 },
  }

  if (!user) return empty

  // ── 1. Portfolio + positions ────────────────────────────────
  const { data: portfolios, error: portErr } = await supabase
    .from("portfolios")
    .select("id, positions ( ticker, allocation_pct, prix_achat )")
    .eq("user_id", user.id)
    .eq("saison", CURRENT_SAISON)
    .order("id", { ascending: false })  // le plus récent en premier si doublon

  if (portErr || !portfolios || portfolios.length === 0) return empty

  const portfolio = portfolios[0]

  type RawPosition = { ticker: string; allocation_pct: number; prix_achat: number }
  const rawPositions = (portfolio.positions ?? []) as RawPosition[]

  if (rawPositions.length === 0) {
    return { ...empty, hasPortfolio: true }
  }

  const tickers = rawPositions.map((p) => p.ticker)

  // ── 2. Cours + classement (en parallèle) ───────────────────
  const [coursRes, classementRes, totalRes] = await Promise.all([
    // ~35 jours de données par ticker pour les 3 perfs + sparkline
    supabase
      .from("cours")
      .select("ticker, prix, date")
      .in("ticker", tickers)
      .order("date", { ascending: false })
      .limit(tickers.length * 40),

    supabase
      .from("classement")
      .select("rang, perf_totale")
      .eq("user_id", user.id)
      .eq("saison", CURRENT_SAISON)
      .maybeSingle(),

    supabase
      .from("classement")
      .select("id", { count: "exact", head: true })
      .eq("saison", CURRENT_SAISON),
  ])

  // ── 3. Index des prix par ticker ────────────────────────────
  const pricesByTicker: Record<string, PricePoint[]> = {}
  for (const c of coursRes.data ?? []) {
    if (!pricesByTicker[c.ticker]) pricesByTicker[c.ticker] = []
    pricesByTicker[c.ticker].push({ prix: Number(c.prix), date: c.date })
    // Les rows sont déjà triées DESC par la requête
  }

  // Dates de référence
  const d1  = isoNDaysAgo(1)   // hier (ou vendredi si lundi)
  const d7  = isoNDaysAgo(7)
  const d30 = isoNDaysAgo(30)

  // ── 4. Calcul des perfs pondérées + construction des lignes ─
  let dayPerf = 0, weekPerf = 0, monthPerf = 0
  let hasDayData = false, hasWeekData = false, hasMonthData = false

  const positions: PositionRow[] = rawPositions.map((pos) => {
    const prices   = pricesByTicker[pos.ticker] ?? []
    const w        = Number(pos.allocation_pct) / 100

    const pCurrent = prices.length > 0 ? prices[0].prix : null
    const p1       = priceOnOrBefore(prices, d1)
    const p7       = priceOnOrBefore(prices, d7)
    const p30      = priceOnOrBefore(prices, d30)

    if (pCurrent && p1) {
      dayPerf += w * ((pCurrent / p1) - 1) * 100
      hasDayData = true
    }
    if (pCurrent && p7) {
      weekPerf += w * ((pCurrent / p7) - 1) * 100
      hasWeekData = true
    }
    if (pCurrent && p30) {
      monthPerf += w * ((pCurrent / p30) - 1) * 100
      hasMonthData = true
    }

    return {
      ticker:         pos.ticker,
      name:           TICKER_MAP[pos.ticker]?.name ?? pos.ticker,
      allocation_pct: Number(pos.allocation_pct),
      prix_actuel:    pCurrent,
      variation_day:  pCurrent && p1
        ? parseFloat(((pCurrent / p1 - 1) * 100).toFixed(2))
        : null,
      // Sparkline : 7 derniers points, triés du plus ancien au plus récent
      sparkline: prices.slice(0, 7).map((p) => p.prix).reverse(),
    }
  })

  // ── 5. Résultat final ───────────────────────────────────────
  return {
    hasPortfolio: true,
    perf: {
      day:    hasDayData   ? parseFloat(dayPerf.toFixed(2))   : null,
      week:   hasWeekData  ? parseFloat(weekPerf.toFixed(2))  : null,
      month:  hasMonthData ? parseFloat(monthPerf.toFixed(2)) : null,
      season: classementRes.data?.perf_totale != null
        ? parseFloat(Number(classementRes.data.perf_totale).toFixed(2))
        : null,
    },
    positions,
    classement: {
      rang:  classementRes.data?.rang ?? null,
      total: totalRes.count ?? 0,
    },
  }
}
