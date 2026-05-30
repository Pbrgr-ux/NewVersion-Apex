/**
 * getProfilData()
 *
 * Fetches all data needed for the Profil page (server-side).
 * Called from app/profil/page.tsx (Server Component).
 *
 * Returns:
 *  - user info (pseudo, email, memberSince)
 *  - classement saison courante (rang, perf, total joueurs)
 *  - historique toutes saisons
 *  - positions actuelles avec cours
 */

import { createClient } from "@/lib/supabase/server"
import { TICKER_MAP }   from "@/lib/tickers"

const CURRENT_SAISON = 1

export type ProfilPosition = {
  ticker:         string
  name:           string
  allocation_pct: number
  prix_actuel:    number | null
}

export type ProfilSaisonRow = {
  saison:      number
  rang:        number | null
  perf_totale: number
  total:       number   // nb total de joueurs cette saison
}

export type ProfilData = {
  user: {
    pseudo:      string
    email:       string
    memberSince: string   // "YYYY-MM-DD"
  }
  saison: {
    rang:        number | null
    perf_totale: number | null
    total:       number
  }
  historique:  ProfilSaisonRow[]
  positions:   ProfilPosition[]
  hasPortfolio: boolean
}

export async function getProfilData(): Promise<ProfilData | null> {
  const supabase = await createClient()

  // ── 1. Utilisateur connecté ────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const pseudo      = (user.user_metadata?.pseudo as string | undefined) ?? user.email?.split("@")[0] ?? "Trader"
  const email       = user.email ?? ""
  const memberSince = user.created_at.split("T")[0]

  // ── 2. Classement + historique + positions en parallèle ───
  const [classementRes, portfolioRes, totalRes] = await Promise.all([
    // Toutes les entrées classement de l'utilisateur
    supabase
      .from("classement")
      .select("saison, rang, perf_totale")
      .eq("user_id", user.id)
      .order("saison", { ascending: false }),

    // Portfolio + positions de la saison courante
    supabase
      .from("portfolios")
      .select("id, positions ( ticker, allocation_pct )")
      .eq("user_id", user.id)
      .eq("saison", CURRENT_SAISON)
      .maybeSingle(),

    // Nb total de joueurs classés par saison
    supabase
      .from("classement")
      .select("saison, rang")
      .order("saison", { ascending: false }),
  ])

  // ── 3. Classement saison courante ─────────────────────────
  const allUserClassement = classementRes.data ?? []
  const saisonCourante    = allUserClassement.find((c) => c.saison === CURRENT_SAISON)

  // Total joueurs par saison (compter les entrées par saison)
  const totalBySaison: Record<number, number> = {}
  for (const row of (totalRes.data ?? [])) {
    totalBySaison[row.saison] = (totalBySaison[row.saison] ?? 0) + 1
  }

  const historique: ProfilSaisonRow[] = allUserClassement.map((c) => ({
    saison:      c.saison,
    rang:        c.rang,
    perf_totale: Number(c.perf_totale),
    total:       totalBySaison[c.saison] ?? 0,
  }))

  // ── 4. Positions + cours actuels ──────────────────────────
  const rawPositions = (portfolioRes.data?.positions ?? []) as Array<{
    ticker: string
    allocation_pct: number
  }>

  const hasPortfolio = rawPositions.length > 0

  let positions: ProfilPosition[] = []

  if (hasPortfolio) {
    const tickers = rawPositions.map((p) => p.ticker)

    const { data: coursData } = await supabase
      .from("cours")
      .select("ticker, prix, date")
      .in("ticker", tickers)
      .order("date", { ascending: false })

    // Prix le plus récent par ticker
    const prixMap: Record<string, number> = {}
    for (const c of coursData ?? []) {
      if (!(c.ticker in prixMap)) prixMap[c.ticker] = Number(c.prix)
    }

    positions = rawPositions
      .sort((a, b) => b.allocation_pct - a.allocation_pct)
      .map((p) => ({
        ticker:         p.ticker,
        name:           TICKER_MAP[p.ticker]?.name ?? p.ticker,
        allocation_pct: Number(p.allocation_pct),
        prix_actuel:    prixMap[p.ticker] ?? null,
      }))
  }

  return {
    user: { pseudo, email, memberSince },
    saison: {
      rang:        saisonCourante?.rang        ?? null,
      perf_totale: saisonCourante ? Number(saisonCourante.perf_totale) : null,
      total:       totalBySaison[CURRENT_SAISON] ?? 0,
    },
    historique,
    positions,
    hasPortfolio,
  }
}
