/**
 * GET /api/update-cours
 *
 * Cron Vercel quotidien — 22h30 UTC (lun-ven, après clôture US)
 * Schedule vercel.json : "30 22 * * 1-5"
 *
 * Étapes :
 *  1. Sync des cours via Yahoo Finance
 *  2. Récupération indices CAC40 + S&P500 (via Yahoo Finance)
 *  3. Lecture portfolios + positions de la saison courante
 *  4. Calcul perf_totale pondérée + perf vs indices
 *  5. Upsert classement avec rangs + statuts joueurs
 *
 * Wild Card : les rookies (inscrits en cours de saison) ont un capital_ajuste
 * différent → leur perf est calculée sur la base de capital_ajuste.
 *
 * Protection : Authorization: Bearer <CRON_SECRET> ou ?secret=<CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient }              from "@supabase/supabase-js"
import type { Database }             from "@/types/database"
import { TICKERS }                   from "@/lib/tickers"
import { fetchAllPrices, fetchPrices } from "@/lib/yahoo-finance"
import { getCurrentSeasonId }        from "@/lib/seasons"

export const maxDuration = 60

// ── Auth ──────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = req.headers.get("authorization")
  if (auth === `Bearer ${secret}`) return true
  return new URL(req.url).searchParams.get("secret") === secret
}

// ── Fetch indice Yahoo Finance ─────────────────────────────────
async function fetchIndicePrice(symbol: string): Promise<number | null> {
  try {
    // Réutilise yahoo-finance2 via fetch direct (pas d'import circulaire)
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    )
    if (!res.ok) return null
    const json = await res.json()
    const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice
    return typeof price === "number" ? price : null
  } catch {
    return null
  }
}

// ── Handler ───────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const limit      = limitParam ? Math.min(parseInt(limitParam, 10), TICKERS.length) : TICKERS.length

  const CURRENT_SAISON = getCurrentSeasonId()
  const today          = new Date().toISOString().split("T")[0]
  const globalStart    = Date.now()

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 1 — Sync Yahoo Finance (cours actions/ETFs)
  // ══════════════════════════════════════════════════════════════
  const prices = limit < TICKERS.length ? await fetchPrices(limit) : await fetchAllPrices()

  let coursOk = 0, coursSkip = 0, coursErrors = 0
  for (const price of prices) {
    const { error } = await supabase.from("cours").upsert(
      { ticker: price.ticker, prix: price.prix, date: price.date },
      { onConflict: "ticker,date" }
    )
    if (error) coursErrors++
    else coursOk++
  }
  coursSkip = limit - prices.length

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 2 — Indices CAC40 + S&P500
  // ══════════════════════════════════════════════════════════════
  const [cac40Prix, sp500Prix] = await Promise.all([
    fetchIndicePrice("^FCHI"),   // CAC 40
    fetchIndicePrice("^GSPC"),   // S&P 500
  ])

  let indicesOk = false
  if (cac40Prix && sp500Prix) {
    // Prix de début de saison pour calculer la variation
    const { data: debutIndice } = await supabase
      .from("indices")
      .select("cac40_prix, sp500_prix")
      .eq("saison_id", CURRENT_SAISON)
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle()

    const cac40Debut  = debutIndice?.cac40_prix  ?? cac40Prix
    const sp500Debut  = debutIndice?.sp500_prix  ?? sp500Prix
    const cac40Var    = ((cac40Prix  / Number(cac40Debut))  - 1) * 100
    const sp500Var    = ((sp500Prix  / Number(sp500Debut))  - 1) * 100

    const { error: idxErr } = await supabase.from("indices").upsert(
      {
        date:                    today,
        saison_id:               CURRENT_SAISON,
        cac40_prix:              cac40Prix,
        sp500_prix:              sp500Prix,
        cac40_variation_saison:  parseFloat(cac40Var.toFixed(4)),
        sp500_variation_saison:  parseFloat(sp500Var.toFixed(4)),
        updated_at:              new Date().toISOString(),
      },
      { onConflict: "date" }
    )
    if (!idxErr) indicesOk = true
  }

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 3 — Portfolios + positions + cours récents
  // ══════════════════════════════════════════════════════════════
  const [portfoliosRes, coursRes] = await Promise.all([
    supabase
      .from("portfolios")
      .select("id, user_id, statut_joueur, capital_initial, capital_ajuste, positions ( ticker, allocation_pct, prix_achat )")
      .eq("saison", CURRENT_SAISON),

    supabase
      .from("cours")
      .select("ticker, prix, date")
      .order("date", { ascending: false }),
  ])

  if (portfoliosRes.error || coursRes.error) {
    return NextResponse.json(
      { error: "Erreur lecture", details: portfoliosRes.error ?? coursRes.error },
      { status: 500 }
    )
  }

  // Prix le plus récent par ticker
  const prixMap: Record<string, number> = {}
  for (const c of coursRes.data ?? []) {
    if (!(c.ticker in prixMap)) prixMap[c.ticker] = Number(c.prix)
  }

  // Indices pour perf vs marché
  const { data: lastIndice } = await supabase
    .from("indices")
    .select("cac40_variation_saison, sp500_variation_saison")
    .eq("saison_id", CURRENT_SAISON)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle()

  const cac40Saison = lastIndice?.cac40_variation_saison ?? null
  const sp500Saison = lastIndice?.sp500_variation_saison ?? null

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 4 — Calcul perf pondérée
  // ══════════════════════════════════════════════════════════════
  type Entry = {
    user_id:       string
    perf_totale:   number
    statut_joueur: string
    perf_vs_cac40: number | null
    perf_vs_sp500: number | null
  }
  const entries: Entry[] = []

  for (const portfolio of portfoliosRes.data ?? []) {
    const positions = (portfolio.positions ?? []) as Array<{
      ticker: string; allocation_pct: number; prix_achat: number
    }>
    if (positions.length === 0) continue

    let perf = 0
    for (const pos of positions) {
      const prixActuel = prixMap[pos.ticker]
      if (!prixActuel || Number(pos.prix_achat) === 0) continue
      perf += (Number(pos.allocation_pct) / 100) * (prixActuel / Number(pos.prix_achat) - 1) * 100
    }

    const perfFinal = parseFloat(perf.toFixed(4))
    entries.push({
      user_id:       portfolio.user_id,
      perf_totale:   perfFinal,
      statut_joueur: portfolio.statut_joueur ?? "confirmed",
      perf_vs_cac40: cac40Saison != null ? parseFloat((perfFinal - Number(cac40Saison)).toFixed(4)) : null,
      perf_vs_sp500: sp500Saison != null ? parseFloat((perfFinal - Number(sp500Saison)).toFixed(4)) : null,
    })
  }

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 5 — Tri par statut + rang séparé confirmed/rookie
  // ══════════════════════════════════════════════════════════════
  const confirmed = entries.filter((e) => e.statut_joueur === "confirmed").sort((a, b) => b.perf_totale - a.perf_totale)
  const rookies   = entries.filter((e) => e.statut_joueur === "rookie").sort((a, b) => b.perf_totale - a.perf_totale)

  const classementRows = [
    ...confirmed.map((e, i) => ({ ...e, rang: i + 1, saison: CURRENT_SAISON, updated_at: new Date().toISOString() })),
    ...rookies.map((e, i)   => ({ ...e, rang: i + 1, saison: CURRENT_SAISON, updated_at: new Date().toISOString() })),
  ]

  let classementErrors = 0
  if (classementRows.length > 0) {
    const { error } = await supabase
      .from("classement")
      .upsert(classementRows, { onConflict: "user_id,saison" })
    if (error) {
      classementErrors++
      console.error("[update-cours] classement upsert:", error)
    }
  }

  const summary = {
    duration_ms: Date.now() - globalStart,
    saison:      CURRENT_SAISON,
    cours:       { tickers_demandes: limit, ok: coursOk, skip: coursSkip, errors: coursErrors },
    indices:     { cac40: cac40Prix, sp500: sp500Prix, ok: indicesOk },
    classement:  { confirmed: confirmed.length, rookies: rookies.length, errors: classementErrors },
  }

  console.log("[update-cours]", JSON.stringify(summary))
  return NextResponse.json({ ok: true, summary })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
