/**
 * GET /api/update-cours
 *
 * Cron Vercel quotidien — 22h30 UTC (00h30 Paris)
 * Schedule vercel.json : "30 22 * * 1-5"  (lun-ven, après clôture US)
 *
 * Avec Vercel Pro, passez au schedule "0,15,30,45 7-22 * * 1-5" pour des
 * mises à jour toutes les 15 minutes pendant les heures de marché.
 *
 * Étapes :
 *  1. Sync des cours via Yahoo Finance (batch, ~1-3 s, gratuit)
 *  2. Lecture de tous les portfolios + positions de la saison courante
 *  3. Calcul de la perf_totale pondérée pour chaque portfolio
 *  4. Upsert dans `classement` avec les rangs triés
 *
 * Protection : Authorization: Bearer <CRON_SECRET>
 *              ou ?secret=<CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient }              from "@supabase/supabase-js"
import type { Database }             from "@/types/database"
import { TICKERS }                   from "@/lib/tickers"
import { fetchAllPrices, fetchPrices } from "@/lib/yahoo-finance"

export const maxDuration = 60 // suffisant — Yahoo Finance répond en < 5s

const CURRENT_SAISON = 1

// ── Auth ──────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = req.headers.get("authorization")
  if (auth === `Bearer ${secret}`) return true
  return new URL(req.url).searchParams.get("secret") === secret
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

  const globalStart = Date.now()

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 1 — Sync Yahoo Finance (batch unique, pas de délai)
  // ══════════════════════════════════════════════════════════════
  const prices = limit < TICKERS.length
    ? await fetchPrices(limit)
    : await fetchAllPrices()

  let coursOk = 0, coursSkip = 0, coursErrors = 0

  for (const price of prices) {
    const { error } = await supabase
      .from("cours")
      .upsert(
        { ticker: price.ticker, prix: price.prix, date: price.date },
        { onConflict: "ticker,date" }
      )
    if (error) coursErrors++
    else coursOk++
  }
  coursSkip = limit - prices.length

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 2 — Lecture portfolios + positions + cours récents
  // ══════════════════════════════════════════════════════════════
  const [portfoliosRes, coursRes] = await Promise.all([
    supabase
      .from("portfolios")
      .select("id, user_id, positions ( ticker, allocation_pct, prix_achat )")
      .eq("saison", CURRENT_SAISON),

    supabase
      .from("cours")
      .select("ticker, prix, date")
      .order("date", { ascending: false }),
  ])

  if (portfoliosRes.error || coursRes.error) {
    return NextResponse.json(
      { error: "Erreur lecture portfolios ou cours", details: portfoliosRes.error ?? coursRes.error },
      { status: 500 }
    )
  }

  // Prix le plus récent par ticker
  const prixMap: Record<string, number> = {}
  for (const c of coursRes.data ?? []) {
    if (!(c.ticker in prixMap)) prixMap[c.ticker] = Number(c.prix)
  }

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 3 — Calcul de la perf pondérée
  //
  // perf_totale (%) = Σ (allocation_pct/100) × (prix_actuel/prix_achat − 1) × 100
  // ══════════════════════════════════════════════════════════════
  type Entry = { user_id: string; perf_totale: number }
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
    entries.push({ user_id: portfolio.user_id, perf_totale: parseFloat(perf.toFixed(4)) })
  }

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 4 — Tri + upsert classement
  // ══════════════════════════════════════════════════════════════
  entries.sort((a, b) => b.perf_totale - a.perf_totale)

  const classementRows = entries.map((e, i) => ({
    user_id:     e.user_id,
    saison:      CURRENT_SAISON,
    perf_totale: e.perf_totale,
    rang:        i + 1,
    updated_at:  new Date().toISOString(),
  }))

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
    source:      "yahoo-finance",
    cours: { tickers_demandes: limit, ok: coursOk, skip: coursSkip, errors: coursErrors },
    classement:  { portfolios_traites: classementRows.length, errors: classementErrors },
  }

  console.log("[update-cours]", JSON.stringify(summary))
  return NextResponse.json({ ok: true, summary })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
