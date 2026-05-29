/**
 * POST /api/sync-cours
 *
 * Récupère le cours de clôture précédent pour les 65 tickers APEX
 * via Polygon.io et upserte dans la table `cours` de Supabase.
 *
 * Plan Polygon FREE (5 req/min) → 1 appel toutes les 13s
 * → durée totale ≈ 14 min  (cron quotidien acceptable)
 *
 * Plan Polygon Starter ($29/mo) → supprimer le CALL_DELAY
 * → durée totale < 30s
 *
 * Protection : Authorization: Bearer <CRON_SECRET>
 *              ou ?secret=<CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient }              from "@supabase/supabase-js"
import type { Database }             from "@/types/database"
import { TICKERS }                   from "@/lib/tickers"

const POLYGON_BASE = "https://api.polygon.io"

/**
 * Délai entre chaque appel Polygon.
 * Plan FREE  : 5 req/min  → 13 000 ms
 * Plan payant: illimité   → 0 ms
 */
const CALL_DELAY = parseInt(process.env.POLYGON_CALL_DELAY_MS ?? "13000", 10)

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
      prix: r.c,
      date: new Date(r.t).toISOString().split("T")[0],
    }
  } catch {
    return null
  }
}

// ── Handler ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
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

  type Result = {
    ticker: string
    status: "ok" | "skip" | "error"
    prix?:  number
    date?:  string
    reason?: string
  }

  // ?limit=N → traite uniquement les N premiers tickers (pratique pour tester)
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), TICKERS.length) : TICKERS.length
  const tickersToProcess = TICKERS.slice(0, limit)

  const results: Result[] = []
  const start = Date.now()

  for (let i = 0; i < tickersToProcess.length; i++) {
    const { ticker } = tickersToProcess[i]

    const data = await fetchPrevClose(ticker, polygonKey)

    if (!data) {
      results.push({ ticker, status: "skip", reason: "Pas de données Polygon" })
    } else {
      const { error } = await supabase
        .from("cours")
        .upsert({ ticker, prix: data.prix, date: data.date }, { onConflict: "ticker,date" })

      if (error) {
        results.push({ ticker, status: "error", reason: error.message })
      } else {
        results.push({ ticker, status: "ok", prix: data.prix, date: data.date })
      }
    }

    // Pause inter-appels (sauf après le dernier ticker)
    if (i < tickersToProcess.length - 1 && CALL_DELAY > 0) {
      await sleep(CALL_DELAY)
    }
  }

  const summary = {
    duration_ms: Date.now() - start,
    call_delay_ms: CALL_DELAY,
    total:  results.length,
    ok:     results.filter((r) => r.status === "ok").length,
    skip:   results.filter((r) => r.status === "skip").length,
    errors: results.filter((r) => r.status === "error").length,
  }

  console.log("[sync-cours]", summary)
  return NextResponse.json({ summary, results })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
