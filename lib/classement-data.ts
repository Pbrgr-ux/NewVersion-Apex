/**
 * getAllClassementData()
 *
 * Calcule les 4 classements (saison, mois, semaine, jour) en une seule
 * passe server-side, en utilisant le client service_role pour lire
 * tous les portfolios/positions (RLS contourné côté serveur uniquement).
 *
 * Données publiques exposées : pseudo, is_pro, rang, perf agrégée.
 * Les positions individuelles ne quittent jamais le serveur.
 */

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createClient as createServerClient } from "@/lib/supabase/server"

const CURRENT_SAISON = 1
const MAX_ENTRIES    = 100

// ── Types publics ─────────────────────────────────────────────
export type LeaderboardEntry = {
  user_id: string
  pseudo:  string
  is_pro:  boolean
  rang:    number
  perf:    number | null   // perf pour la période affichée (%)
}

export type AllClassementData = {
  saison:        LeaderboardEntry[]
  mois:          LeaderboardEntry[]
  semaine:       LeaderboardEntry[]
  jour:          LeaderboardEntry[]
  currentUserId: string | null
}

// ── Client admin (service_role) ────────────────────────────────
function adminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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
  return found != null ? Number(found.prix) : null
}

/** Trie par perf DESC (nulls en bas), assigne les rangs, retourne max 100. */
function sortAndRank(
  entries: Array<{ user_id: string; perf: number | null }>,
  userMap: Map<string, { pseudo: string; is_pro: boolean }>
): LeaderboardEntry[] {
  return entries
    .filter((e) => e.perf !== null)          // écarte les sans-données
    .sort((a, b) => (b.perf ?? -Infinity) - (a.perf ?? -Infinity))
    .slice(0, MAX_ENTRIES)
    .map((e, i) => ({
      user_id: e.user_id,
      pseudo:  userMap.get(e.user_id)?.pseudo  ?? e.user_id,
      is_pro:  userMap.get(e.user_id)?.is_pro  ?? false,
      rang:    i + 1,
      perf:    e.perf,
    }))
}

// ── Fetch principal ───────────────────────────────────────────
export async function getAllClassementData(): Promise<AllClassementData> {
  const admin = adminClient()

  // Utilisateur courant (anon client avec session cookie)
  const serverClient            = await createServerClient()
  const { data: { user: me } } = await serverClient.auth.getUser()
  const currentUserId           = me?.id ?? null

  // ── 1. Requêtes parallèles ──────────────────────────────────
  const [usersRes, classementRes, portfoliosRes, coursRes] = await Promise.all([
    admin
      .from("users")
      .select("id, pseudo, is_pro"),

    admin
      .from("classement")
      .select("user_id, rang, perf_totale")
      .eq("saison", CURRENT_SAISON)
      .order("perf_totale", { ascending: false })
      .limit(MAX_ENTRIES),

    admin
      .from("portfolios")
      .select("user_id, positions ( ticker, allocation_pct )")
      .eq("saison", CURRENT_SAISON),

    // 35 jours de cours pour tous les tickers (65 × 35 ≈ 2275 rows max)
    admin
      .from("cours")
      .select("ticker, prix, date")
      .order("date", { ascending: false })
      .limit(65 * 40),
  ])

  // ── 2. Index des utilisateurs ───────────────────────────────
  const userMap = new Map<string, { pseudo: string; is_pro: boolean }>()
  for (const u of usersRes.data ?? []) {
    userMap.set(u.id, { pseudo: u.pseudo, is_pro: u.is_pro })
  }

  // ── 3. Tab Saison ── déjà calculé par le cron ───────────────
  const saisonEntries: LeaderboardEntry[] = (classementRes.data ?? []).map((c, i) => ({
    user_id: c.user_id,
    pseudo:  userMap.get(c.user_id)?.pseudo ?? c.user_id,
    is_pro:  userMap.get(c.user_id)?.is_pro ?? false,
    rang:    i + 1,
    perf:    c.perf_totale != null ? parseFloat(Number(c.perf_totale).toFixed(2)) : null,
  }))

  // ── 4. Index des cours par ticker ───────────────────────────
  const pricesByTicker = new Map<string, PricePoint[]>()
  for (const c of coursRes.data ?? []) {
    if (!pricesByTicker.has(c.ticker)) pricesByTicker.set(c.ticker, [])
    pricesByTicker.get(c.ticker)!.push({ prix: Number(c.prix), date: c.date })
  }

  const d1  = isoNDaysAgo(1)
  const d7  = isoNDaysAgo(7)
  const d30 = isoNDaysAgo(30)

  // ── 5. Calcul des perfs jour/semaine/mois pour chaque user ──
  type UserPerf = { user_id: string; jour: number | null; semaine: number | null; mois: number | null }
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
      const p1       = priceOnOrBefore(prices, d1)
      const p7       = priceOnOrBefore(prices, d7)
      const p30      = priceOnOrBefore(prices, d30)
      const w        = Number(pos.allocation_pct) / 100

      if (pCurrent && p1)  { pJour    += w * (pCurrent / p1  - 1) * 100; hasJour    = true }
      if (pCurrent && p7)  { pSemaine += w * (pCurrent / p7  - 1) * 100; hasSemaine = true }
      if (pCurrent && p30) { pMois    += w * (pCurrent / p30 - 1) * 100; hasMois    = true }
    }

    userPerfs.push({
      user_id:  portfolio.user_id,
      jour:     hasJour    ? parseFloat(pJour.toFixed(2))    : null,
      semaine:  hasSemaine ? parseFloat(pSemaine.toFixed(2)) : null,
      mois:     hasMois    ? parseFloat(pMois.toFixed(2))    : null,
    })
  }

  // ── 6. Construction des classements par période ─────────────
  return {
    saison:  saisonEntries,
    jour:    sortAndRank(userPerfs.map((u) => ({ user_id: u.user_id, perf: u.jour    })), userMap),
    semaine: sortAndRank(userPerfs.map((u) => ({ user_id: u.user_id, perf: u.semaine })), userMap),
    mois:    sortAndRank(userPerfs.map((u) => ({ user_id: u.user_id, perf: u.mois    })), userMap),
    currentUserId,
  }
}
