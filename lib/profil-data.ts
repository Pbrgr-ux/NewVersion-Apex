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

import { createClient }                        from "@/lib/supabase/server"
import { TICKER_MAP }                          from "@/lib/tickers"
import { getCurrentSeasonId } from "@/lib/seasons"
import { getSaisonsNomMap }   from "@/lib/seasons-server"

export type ProfilPosition = {
  ticker:         string
  name:           string
  allocation_pct: number
  prix_actuel:    number | null
}

export type ProfilSaisonRow = {
  saison:      number
  nom:         string   // nom admin ou fallback "Saison SX"
  rang:        number | null
  perf_totale: number
  total:       number
}

export type AllTimeStats = {
  nb_saisons:           number
  meilleur_rang:        number | null
  meilleur_rang_saison: string | null
  alpha_moyen:          number | null
  top10_count:          number
  win_rate:             number | null
  perf_totale_cumulee:  number
}

export type ProfilData = {
  user: {
    pseudo:      string
    email:       string
    memberSince: string   // "YYYY-MM-DD"
    isPro:       boolean
    isAdmin:     boolean
  }
  saison: {
    rang:        number | null
    perf_totale: number | null
    total:       number
    statut_joueur: string
  }
  historique:   ProfilSaisonRow[]
  positions:    ProfilPosition[]
  hasPortfolio: boolean
  allTime:      AllTimeStats | null
}

export async function getProfilData(): Promise<ProfilData | null> {
  const supabase = await createClient()

  // ── 1. Utilisateur connecté ────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // ── 2. Données depuis la table users (pseudo, is_pro) ─────
  // La table users est alimentée par le trigger handle_new_user()
  // Fallback sur user_metadata si la ligne n'existe pas encore
  const { data: dbUser } = await supabase
    .from("users")
    .select("pseudo, is_pro, email, created_at")
    .eq("id", user.id)
    .maybeSingle()

  const pseudo      = dbUser?.pseudo    ?? (user.user_metadata?.pseudo as string | undefined) ?? user.email?.split("@")[0] ?? "Trader"
  const email       = dbUser?.email     ?? user.email ?? ""
  const memberSince = (dbUser?.created_at ?? user.created_at).split("T")[0]
  const isPro       = dbUser?.is_pro    ?? false
  const isAdmin     = (dbUser as { is_admin?: boolean } | null)?.is_admin ?? false

  const CURRENT_SAISON = getCurrentSeasonId()

  // ── 3. Classement + historique + positions + palmares en parallèle ───
  const [classementRes, portfolioRes, totalRes, palmRes, nomMap] = await Promise.all([
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

    // Palmares all-time
    supabase
      .from("palmares_all_time")
      .select("rang_final, perf_totale, top10, saison_id")
      .eq("user_id", user.id)
      .order("saison_id", { ascending: false }),

    // Noms des saisons
    getSaisonsNomMap(),
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
    nom:         nomMap?.get(c.saison) ?? `Saison S${c.saison}`,
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

  // ── All-Time stats ────────────────────────────────────────
  let allTime: AllTimeStats | null = null
  const palmRows = palmRes?.data ?? []
  if (palmRows.length > 0) {
    const perfs    = palmRows.map((r) => Number(r.perf_totale))
    const rangs    = palmRows.map((r) => r.rang_final).filter(Boolean) as number[]
    const bestRang = rangs.length > 0 ? Math.min(...rangs) : null
    const bestS    = bestRang != null ? palmRows.find((r) => r.rang_final === bestRang) : null

    allTime = {
      nb_saisons:           palmRows.length,
      meilleur_rang:        bestRang,
      meilleur_rang_saison: bestS ? `S${bestS.saison_id}` : null,
      alpha_moyen:          perfs.length > 0 ? parseFloat((perfs.reduce((a, b) => a + b, 0) / perfs.length).toFixed(2)) : null,
      top10_count:          palmRows.filter((r) => r.top10).length,
      win_rate:             perfs.length > 0 ? parseFloat(((perfs.filter((p) => p > 0).length / perfs.length) * 100).toFixed(1)) : null,
      perf_totale_cumulee:  parseFloat(perfs.reduce((a, b) => a + b, 0).toFixed(2)),
    }
  }

  return {
    user: { pseudo, email, memberSince, isPro, isAdmin },
    saison: {
      rang:          saisonCourante?.rang ?? null,
      perf_totale:   saisonCourante ? Number(saisonCourante.perf_totale) : null,
      total:         totalBySaison[CURRENT_SAISON] ?? 0,
      statut_joueur: "confirmed",
    },
    historique,
    positions,
    hasPortfolio,
    allTime,
  }
}
