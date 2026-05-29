/**
 * GET /api/update-cours
 *
 * Cron Vercel quotidien — 16h05 UTC = 18h05 CEST (Europe/Paris, été)
 * Schedule dans vercel.json : "5 16 * * 1-5"  (lun-ven seulement)
 *
 * Étapes exécutées dans l'ordre :
 *  1. Sync des cours de clôture via Polygon.io (tous les tickers APEX)
 *  2. Lecture de tous les portfolios + positions de la saison courante
 *  3. Calcul de la perf_totale pondérée pour chaque portfolio
 *  4. Upsert dans `classement` avec les nouveaux rangs triés
 *
 * Protection : Authorization: Bearer <CRON_SECRET>
 *              ou ?secret=<CRON_SECRET>
 *
 * ⚠️  Durée estimée avec Polygon FREE (13s/appel) : ~14 min
 *     → Nécessite Vercel Pro (maxDuration = 300s) ou Polygon Starter
 *     → Pour tester en local : ?limit=3 (≈ 40s)
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient }              from "@supabase/supabase-js"
import type { Database }             from "@/types/database"
import { TICKERS }                   from "@/lib/tickers"

export const maxDuration = 300 // Vercel Pro — Hobby : 60s max

const POLYGON_BASE  = "https://api.polygon.io"
const CALL_DELAY    = parseInt(process.env.POLYGON_CALL_DELAY_MS ?? "13000", 10)
const CURRENT_SAISON = 1 // TODO: rendre dynamique (ex. new Date().getFullYear() - 2024)

// ── Auth ──────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = req.headers.get("authorization")
  if (auth === `Bearer ${secret}`) return true
  return new URL(req.url).searchParams.get("secret") === secret
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ── Polygon /prev ─────────────────────────────────────────────
async function fetchPrevClose(
  ticker: string,
  apiKey: string
): Promise<{ prix: number; date: string } | null> {
  try {
    const url =
      `${POLYGON_BASE}/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev` +
      `?adjusted=true&apiKey=${apiKey}`

    const res = await fetch(url, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null

    const json = await res.json()
    const r = json.results?.[0]
    if (!r?.c) return null

    return {
      prix: r.c as number,
      date: new Date(r.t).toISOString().split("T")[0],
    }
  } catch {
    return null
  }
}

// ── Handler principal ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const polygonKey = process.env.POLYGON_API_KEY
  if (!polygonKey) {
    return NextResponse.json({ error: "POLYGON_API_KEY manquante" }, { status: 500 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ?limit=N pour tester sur un sous-ensemble de tickers
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const limit = limitParam
    ? Math.min(parseInt(limitParam, 10), TICKERS.length)
    : TICKERS.length
  const tickersToProcess = TICKERS.slice(0, limit)

  const globalStart = Date.now()

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 1 — Synchronisation des cours Polygon
  // ══════════════════════════════════════════════════════════════
  let coursOk = 0, coursSkip = 0, coursErrors = 0

  for (let i = 0; i < tickersToProcess.length; i++) {
    const { ticker } = tickersToProcess[i]
    const data = await fetchPrevClose(ticker, polygonKey)

    if (!data) {
      coursSkip++
    } else {
      const { error } = await supabase
        .from("cours")
        .upsert(
          { ticker, prix: data.prix, date: data.date },
          { onConflict: "ticker,date" }
        )
      if (error) coursErrors++
      else coursOk++
    }

    if (i < tickersToProcess.length - 1 && CALL_DELAY > 0) {
      await sleep(CALL_DELAY)
    }
  }

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 2 — Lecture des portfolios + positions + cours récents
  // ══════════════════════════════════════════════════════════════
  const [portfoliosRes, coursRes] = await Promise.all([
    supabase
      .from("portfolios")
      .select(`
        id,
        user_id,
        positions ( ticker, allocation_pct, prix_achat )
      `)
      .eq("saison", CURRENT_SAISON),

    supabase
      .from("cours")
      .select("ticker, prix, date")
      .order("date", { ascending: false }),
  ])

  if (portfoliosRes.error || coursRes.error) {
    return NextResponse.json(
      {
        error: "Erreur lecture portfolios ou cours",
        details: portfoliosRes.error ?? coursRes.error,
      },
      { status: 500 }
    )
  }

  // Prix le plus récent par ticker (le premier après ORDER BY date DESC)
  const prixMap: Record<string, number> = {}
  for (const c of coursRes.data ?? []) {
    if (!(c.ticker in prixMap)) prixMap[c.ticker] = Number(c.prix)
  }

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 3 — Calcul de la performance pondérée par portfolio
  //
  // Formule :
  //   perf_totale (%) = Σ (allocation_pct / 100) × ((prix_actuel / prix_achat) - 1) × 100
  //
  // Ex : 60 % AAPL acheté à 150 → cours actuel 165
  //      contrib = 0.60 × (165/150 - 1) × 100 = 6 %
  // ══════════════════════════════════════════════════════════════
  type Entry = { user_id: string; perf_totale: number }
  const entries: Entry[] = []

  for (const portfolio of portfoliosRes.data ?? []) {
    const positions = (portfolio.positions ?? []) as Array<{
      ticker: string
      allocation_pct: number
      prix_achat: number
    }>

    if (positions.length === 0) continue

    let perf = 0
    for (const pos of positions) {
      const prixActuel = prixMap[pos.ticker]
      if (!prixActuel || Number(pos.prix_achat) === 0) continue
      perf +=
        (Number(pos.allocation_pct) / 100) *
        (prixActuel / Number(pos.prix_achat) - 1) *
        100
    }

    entries.push({
      user_id: portfolio.user_id,
      perf_totale: parseFloat(perf.toFixed(4)),
    })
  }

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 4 — Tri et upsert dans `classement`
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
      console.error("[update-cours] classement upsert error:", error)
    }
  }

  // ── Résumé ────────────────────────────────────────────────────
  const summary = {
    duration_ms:        Date.now() - globalStart,
    saison:             CURRENT_SAISON,
    cours: {
      tickers_traites: tickersToProcess.length,
      ok:     coursOk,
      skip:   coursSkip,
      errors: coursErrors,
    },
    classement: {
      portfolios_traites: classementRows.length,
      errors:             classementErrors,
      top3: classementRows.slice(0, 3).map((r) => ({
        user_id: r.user_id,
        perf:    r.perf_totale,
        rang:    r.rang,
      })),
    },
  }

  console.log("[update-cours]", JSON.stringify(summary))
  return NextResponse.json({ ok: true, summary })
}

// Vercel envoie un POST pour les cron jobs — les deux sont supportés
export async function POST(request: NextRequest) {
  return GET(request)
}
