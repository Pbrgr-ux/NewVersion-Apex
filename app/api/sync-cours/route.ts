/**
 * GET /api/sync-cours
 *
 * Récupère les cours de tous les tickers APEX via Yahoo Finance
 * et les upserte dans la table `cours` de Supabase.
 *
 * ✅ Gratuit — aucune clé API requise
 * ✅ Couverture US + Europe + ETFs
 * ✅ Pas de rate limit → tous les tickers en un seul batch (~1-3 s)
 * ⚠️  Délai données : ~15 min (US) / clôture J (EU)
 *
 * Paramètres :
 *   ?limit=N          — traite uniquement les N premiers tickers (test)
 *   ?secret=<secret>  — auth alternative à l'header Authorization
 *
 * Protection : Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient }              from "@supabase/supabase-js"
import type { Database }             from "@/types/database"
import { TICKERS }                   from "@/lib/tickers"
import { fetchAllPrices, fetchPrices } from "@/lib/yahoo-finance"

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

  // Paramètre ?limit=N pour tester sur un sous-ensemble
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const limit      = limitParam ? Math.min(parseInt(limitParam, 10), TICKERS.length) : TICKERS.length

  const start  = Date.now()
  const prices = limit < TICKERS.length
    ? await fetchPrices(limit)
    : await fetchAllPrices()

  let ok = 0, skip = 0, errors = 0

  for (const price of prices) {
    const { error } = await supabase
      .from("cours")
      .upsert(
        { ticker: price.ticker, prix: price.prix, date: price.date },
        { onConflict: "ticker,date" }
      )
    if (error) {
      console.error(`[sync-cours] upsert error ${price.ticker}:`, error.message)
      errors++
    } else {
      ok++
    }
  }

  skip = limit - prices.length // tickers pour lesquels Yahoo n'a pas retourné de prix

  const summary = {
    duration_ms:     Date.now() - start,
    tickers_demandes: limit,
    ok,
    skip,
    errors,
  }

  console.log("[sync-cours]", summary)
  return NextResponse.json({ summary })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
