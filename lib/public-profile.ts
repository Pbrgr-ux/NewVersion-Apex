/**
 * lib/public-profile.ts  (SERVER-ONLY)
 *
 * Résumé public d'un joueur pour la page de partage /u/[id] et l'image OG.
 * Lecture via service_role (page publique, sans session). AUCUNE position.
 */

import { createClient }      from "@supabase/supabase-js"
import type { Database }     from "@/types/database"
import { getCurrentSeasonId } from "@/lib/seasons"
import { getEffectivePro }    from "@/lib/pro"

function admin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type PublicProfile = {
  userId:      string
  pseudo:      string
  avatar:      string | null
  isPro:       boolean
  rang:        number | null
  total:       number
  topPct:      number | null   // percentile : rang/total (ex. 5 = Top 5%)
  seasonPerf:  number | null
  weekPerf:    number | null   // perf de la semaine (jeu principal)
  weekSpark:   number[]        // ~7 points normalisés [0..1] pour le mini-graphe
  allTimePerf: number | null
  seasonNom:   string
}

function isoNDaysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().split("T")[0]
}
function priceOnOrBefore(prices: { prix: number; date: string }[], target: string): number | null {
  const f = prices.find((p) => p.date <= target)
  return f ? Number(f.prix) : null
}
function safeContribution(cur: number | null, past: number | null, w: number): number | null {
  if (cur == null || past == null || past <= 0) return null
  const r = cur / past
  if (r > 10 || r < 0.1) return null
  return w * (r - 1) * 100
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const db     = admin()
  const saison = getCurrentSeasonId()

  const { data: user } = await db
    .from("users")
    .select("id, pseudo, avatar, is_pro, pro_until")
    .eq("id", userId)
    .maybeSingle()
  if (!user) return null

  const [classRes, totalRes, palmRes, saisonRes] = await Promise.all([
    db.from("classement")
      .select("rang, perf_totale")
      .eq("user_id", userId)
      .eq("saison", saison)
      .maybeSingle(),
    db.from("classement")
      .select("id", { count: "exact", head: true })
      .eq("saison", saison)
      .eq("statut_joueur", "confirmed"),
    db.from("palmares_all_time")
      .select("perf_totale")
      .eq("user_id", userId),
    db.from("saisons")
      .select("nom, saison_code")
      .eq("id", saison)
      .maybeSingle(),
  ])

  const seasonNom = saisonRes.data?.nom?.trim() || `Season ${saisonRes.data?.saison_code ?? saison}`

  const seasonPerf = classRes.data?.perf_totale != null
    ? parseFloat(Number(classRes.data.perf_totale).toFixed(2))
    : null

  // Perf all-time composée : Π(1+perf) sur saisons terminées × saison courante
  let factor = 1
  let hasAllTime = false
  for (const p of (palmRes.data ?? []) as Array<{ perf_totale: number }>) {
    factor *= 1 + Number(p.perf_totale) / 100
    hasAllTime = true
  }
  if (seasonPerf != null) { factor *= 1 + seasonPerf / 100; hasAllTime = true }
  const allTimePerf = hasAllTime ? parseFloat(((factor - 1) * 100).toFixed(2)) : null

  const rang  = classRes.data?.rang ?? null
  const total = totalRes.count ?? 0
  // Percentile seulement si l'échantillon est significatif (sinon "Top 33%" sur 3 joueurs trompe)
  const topPct = rang && total >= 10 ? Math.max(1, Math.round((rang / total) * 100)) : null

  // ── Perf de la semaine + mini-graphe (jeu principal) ──────────
  let weekPerf: number | null = null
  let weekSpark: number[] = []
  const { data: pf } = await db
    .from("portfolios").select("id")
    .eq("user_id", userId).eq("saison", saison).is("league_id", null)
    .order("id", { ascending: false }).limit(1).maybeSingle()

  if (pf) {
    const { data: positions } = await db
      .from("positions")
      .select("ticker, allocation_pct, open_price")
      .eq("portfolio_id", pf.id).eq("status", "open")

    const open = positions ?? []
    if (open.length > 0) {
      const tickers = open.map((p) => p.ticker)
      const { data: coursRows } = await db
        .from("cours").select("ticker, prix, date")
        .in("ticker", tickers).gte("date", isoNDaysAgo(9))
        .order("date", { ascending: false })

      const byTicker: Record<string, { prix: number; date: string }[]> = {}
      for (const c of coursRows ?? []) (byTicker[c.ticker] ??= []).push({ prix: Number(c.prix), date: c.date })

      // weekPerf = Σ w·(prix_now / prix_7j − 1)
      const d7 = isoNDaysAgo(7)
      let wp = 0, hasWp = false
      for (const p of open) {
        const prices = byTicker[p.ticker] ?? []
        const now = prices[0]?.prix ?? null
        const past = priceOnOrBefore(prices, d7)
        const c = safeContribution(now, past, Number(p.allocation_pct) / 100)
        if (c != null) { wp += c; hasWp = true }
      }
      weekPerf = hasWp ? parseFloat(wp.toFixed(2)) : null

      // Sparkline : indice pondéré normalisé sur les 7 derniers jours
      const days = Array.from({ length: 7 }, (_, i) => isoNDaysAgo(6 - i))   // J-6 → J
      const series = days.map((d) => {
        let val = 0, ok = false
        for (const p of open) {
          const prices = byTicker[p.ticker] ?? []
          const base = priceOnOrBefore(prices, days[0])
          const px   = priceOnOrBefore(prices, d)
          if (base && px && base > 0) { val += (Number(p.allocation_pct) / 100) * (px / base); ok = true }
        }
        return ok ? val : null
      }).filter((v): v is number => v != null)
      if (series.length >= 2) {
        const min = Math.min(...series), max = Math.max(...series)
        const span = max - min || 1
        weekSpark = series.map((v) => (v - min) / span)   // 0..1
      }
    }
  }

  return {
    userId:      user.id,
    pseudo:      user.pseudo,
    avatar:      user.avatar,
    isPro:       getEffectivePro(user),
    rang,
    total,
    topPct,
    seasonPerf,
    weekPerf,
    weekSpark,
    allTimePerf,
    seasonNom,
  }
}
