/**
 * getAllClassementData()
 *
 * Calcule les classements confirmed + rookie + périodes (mois, semaine, jour).
 * Utilise service_role pour lire tous les portfolios sans RLS.
 */

import { createClient }               from "@supabase/supabase-js"
import type { Database }              from "@/types/database"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { getCurrentSeasonId, getSaisonsNomMap } from "@/lib/seasons"

const MAX_ENTRIES = 100

// ── Types ─────────────────────────────────────────────────────
export type LeaderboardEntry = {
  user_id:       string
  pseudo:        string
  is_pro:        boolean
  rang:          number
  perf:          number | null
  statut_joueur: string           // "confirmed" | "rookie"
  perf_vs_cac40?: number | null
  perf_vs_sp500?: number | null
}

export type AllClassementData = {
  confirmed:       LeaderboardEntry[]
  rookie:          LeaderboardEntry[]
  mois:            LeaderboardEntry[]
  semaine:         LeaderboardEntry[]
  jour:            LeaderboardEntry[]
  currentUserId:   string | null
  currentSaisonNom: string
  indices: {
    cac40_variation: number | null
    sp500_variation: number | null
  }
}

// ── Client admin ──────────────────────────────────────────────
function adminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isoNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split("T")[0]
}

type PricePoint = { prix: number; date: string }

function priceOnOrBefore(prices: PricePoint[], targetDate: string): number | null {
  const found = prices.find((p) => p.date <= targetDate)
  return found != null ? Number(found.prix) : null
}

function sortAndRank(
  entries: Array<{ user_id: string; perf: number | null; statut_joueur?: string; perf_vs_cac40?: number | null; perf_vs_sp500?: number | null }>,
  userMap: Map<string, { pseudo: string; is_pro: boolean }>
): LeaderboardEntry[] {
  return entries
    .filter((e) => e.perf !== null)
    .sort((a, b) => (b.perf ?? -Infinity) - (a.perf ?? -Infinity))
    .slice(0, MAX_ENTRIES)
    .map((e, i) => ({
      user_id:       e.user_id,
      pseudo:        userMap.get(e.user_id)?.pseudo  ?? e.user_id,
      is_pro:        userMap.get(e.user_id)?.is_pro  ?? false,
      rang:          i + 1,
      perf:          e.perf,
      statut_joueur: e.statut_joueur ?? "confirmed",
      perf_vs_cac40: e.perf_vs_cac40 ?? null,
      perf_vs_sp500: e.perf_vs_sp500 ?? null,
    }))
}

// ── Fetch principal ───────────────────────────────────────────
export async function getAllClassementData(): Promise<AllClassementData> {
  const admin          = adminClient()
  const CURRENT_SAISON = getCurrentSeasonId()

  const serverClient            = await createServerClient()
  const { data: { user: me } } = await serverClient.auth.getUser()
  const currentUserId           = me?.id ?? null

  const [usersRes, classementRes, portfoliosRes, coursRes, lastIndice, nomMap] = await Promise.all([
    admin.from("users").select("id, pseudo, is_pro"),

    admin
      .from("classement")
      .select("user_id, rang, perf_totale, statut_joueur, perf_vs_cac40, perf_vs_sp500")
      .eq("saison", CURRENT_SAISON)
      .order("perf_totale", { ascending: false })
      .limit(MAX_ENTRIES * 2),   // confirmed + rookie

    admin
      .from("portfolios")
      .select("user_id, statut_joueur, positions ( ticker, allocation_pct )")
      .eq("saison", CURRENT_SAISON),

    admin
      .from("cours")
      .select("ticker, prix, date")
      .order("date", { ascending: false })
      .limit(65 * 40),

    admin
      .from("indices")
      .select("cac40_variation_saison, sp500_variation_saison")
      .eq("saison_id", CURRENT_SAISON)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),

    getSaisonsNomMap(),
  ])

  const userMap = new Map<string, { pseudo: string; is_pro: boolean }>()
  for (const u of usersRes.data ?? []) {
    userMap.set(u.id, { pseudo: u.pseudo, is_pro: u.is_pro })
  }

  const indices = {
    cac40_variation: lastIndice.data?.cac40_variation_saison ?? null,
    sp500_variation: lastIndice.data?.sp500_variation_saison ?? null,
  }

  // ── Classement saison (confirmed séparé de rookie) ────────────
  const allClassement = classementRes.data ?? []

  const confirmed: LeaderboardEntry[] = allClassement
    .filter((c) => (c.statut_joueur ?? "confirmed") === "confirmed")
    .map((c, i) => ({
      user_id:       c.user_id,
      pseudo:        userMap.get(c.user_id)?.pseudo ?? c.user_id,
      is_pro:        userMap.get(c.user_id)?.is_pro ?? false,
      rang:          i + 1,
      perf:          c.perf_totale != null ? parseFloat(Number(c.perf_totale).toFixed(2)) : null,
      statut_joueur: "confirmed",
      perf_vs_cac40: c.perf_vs_cac40 != null ? Number(c.perf_vs_cac40) : null,
      perf_vs_sp500: c.perf_vs_sp500 != null ? Number(c.perf_vs_sp500) : null,
    }))

  const rookie: LeaderboardEntry[] = allClassement
    .filter((c) => c.statut_joueur === "rookie")
    .map((c, i) => ({
      user_id:       c.user_id,
      pseudo:        userMap.get(c.user_id)?.pseudo ?? c.user_id,
      is_pro:        userMap.get(c.user_id)?.is_pro ?? false,
      rang:          i + 1,
      perf:          c.perf_totale != null ? parseFloat(Number(c.perf_totale).toFixed(2)) : null,
      statut_joueur: "rookie",
      perf_vs_cac40: c.perf_vs_cac40 != null ? Number(c.perf_vs_cac40) : null,
      perf_vs_sp500: c.perf_vs_sp500 != null ? Number(c.perf_vs_sp500) : null,
    }))

  // ── Perfs jour / semaine / mois ───────────────────────────────
  const pricesByTicker = new Map<string, PricePoint[]>()
  for (const c of coursRes.data ?? []) {
    if (!pricesByTicker.has(c.ticker)) pricesByTicker.set(c.ticker, [])
    pricesByTicker.get(c.ticker)!.push({ prix: Number(c.prix), date: c.date })
  }

  const d1 = isoNDaysAgo(1), d7 = isoNDaysAgo(7), d30 = isoNDaysAgo(30)

  type UserPerf = { user_id: string; statut_joueur: string; jour: number | null; semaine: number | null; mois: number | null }
  const userPerfs: UserPerf[] = []

  for (const portfolio of portfoliosRes.data ?? []) {
    type RawPos = { ticker: string; allocation_pct: number }
    const positions = (portfolio.positions ?? []) as RawPos[]
    if (positions.length === 0) continue

    let pJour = 0, pSemaine = 0, pMois = 0
    let hasJour = false, hasSemaine = false, hasMois = false

    for (const pos of positions) {
      const prices   = pricesByTicker.get(pos.ticker) ?? []
      const pCurrent = prices.length > 0 ? prices[0].prix : null
      const p1 = priceOnOrBefore(prices, d1), p7 = priceOnOrBefore(prices, d7), p30 = priceOnOrBefore(prices, d30)
      const w  = Number(pos.allocation_pct) / 100

      if (pCurrent && p1)  { pJour    += w * (pCurrent / p1  - 1) * 100; hasJour    = true }
      if (pCurrent && p7)  { pSemaine += w * (pCurrent / p7  - 1) * 100; hasSemaine = true }
      if (pCurrent && p30) { pMois    += w * (pCurrent / p30 - 1) * 100; hasMois    = true }
    }

    userPerfs.push({
      user_id:       portfolio.user_id,
      statut_joueur: portfolio.statut_joueur ?? "confirmed",
      jour:          hasJour    ? parseFloat(pJour.toFixed(2))    : null,
      semaine:       hasSemaine ? parseFloat(pSemaine.toFixed(2)) : null,
      mois:          hasMois    ? parseFloat(pMois.toFixed(2))    : null,
    })
  }

  return {
    confirmed,
    rookie,
    mois:    sortAndRank(userPerfs.map((u) => ({ ...u, perf: u.mois    })), userMap),
    semaine: sortAndRank(userPerfs.map((u) => ({ ...u, perf: u.semaine })), userMap),
    jour:    sortAndRank(userPerfs.map((u) => ({ ...u, perf: u.jour    })), userMap),
    currentUserId,
    currentSaisonNom: nomMap?.get(CURRENT_SAISON) ?? `Saison S${CURRENT_SAISON}`,
    indices,
  }
}
