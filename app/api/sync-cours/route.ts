/**
 * POST /api/sync-cours
 *
 * Récupère le cours de clôture de la veille pour les 65 tickers
 * autorisés via Polygon.io et insère/met à jour la table `cours`
 * dans Supabase.
 *
 * Protégé par un secret : Header  Authorization: Bearer <CRON_SECRET>
 * ou query param           ?secret=<CRON_SECRET>
 *
 * À appeler chaque jour ouvré après la clôture des marchés US (22h30 CET).
 * Peut être déclenché par :
 *   - Vercel Cron Jobs (vercel.json)
 *   - GitHub Actions (schedule)
 *   - Supabase Edge Functions
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient }              from "@supabase/supabase-js"
import type { Database }             from "@/types/database"
import { TICKERS }                   from "@/lib/tickers"

// ── Config ────────────────────────────────────────────────────
const POLYGON_BASE  = "https://api.polygon.io"
const BATCH_SIZE    = 5          // appels Polygon en parallèle
const BATCH_DELAY   = 1200       // ms entre les batchs (évite le rate-limit)

type PolygonPrevResult = {
  T:  string   // ticker
  c:  number   // close
  o:  number   // open
  h:  number   // high
  l:  number   // low
  v:  number   // volume
  vw: number   // VWAP
  t:  number   // timestamp (ms)
}

type SyncResult = {
  ticker:  string
  status:  "ok" | "skip" | "error"
  date?:   string
  prix?:   number
  reason?: string
}

// ── Auth helper ────────────────────────────────────────────────
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // pas de secret configuré → dev local

  const authHeader = request.headers.get("authorization")
  if (authHeader === `Bearer ${cronSecret}`) return true

  const { searchParams } = new URL(request.url)
  if (searchParams.get("secret") === cronSecret) return true

  return false
}

// ── Polygon fetch (cours précédent) ───────────────────────────
async function fetchPrevClose(
  ticker: string,
  apiKey: string
): Promise<{ prix: number; date: string } | null> {
  const url = `${POLYGON_BASE}/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev?adjusted=true&apiKey=${apiKey}`

  const res = await fetch(url, {
    next: { revalidate: 0 },          // pas de cache Next.js
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return null

  const json = await res.json()
  const result: PolygonPrevResult | undefined = json.results?.[0]
  if (!result) return null

  const date = new Date(result.t).toISOString().split("T")[0]
  return { prix: result.c, date }
}

// ── Batch helper ──────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ── Handler ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const polygonKey = process.env.POLYGON_API_KEY
  if (!polygonKey) {
    return NextResponse.json(
      { error: "POLYGON_API_KEY manquante dans .env.local" },
      { status: 500 }
    )
  }

  // Supabase avec service_role pour bypass RLS sur la table cours
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results: SyncResult[] = []
  const startedAt = Date.now()

  // ── Traitement par batchs ───────────────────────────────────
  for (let i = 0; i < TICKERS.length; i += BATCH_SIZE) {
    const batch = TICKERS.slice(i, i + BATCH_SIZE)

    const batchResults = await Promise.all(
      batch.map(async ({ ticker }): Promise<SyncResult> => {
        try {
          const data = await fetchPrevClose(ticker, polygonKey)

          if (!data) {
            return { ticker, status: "skip", reason: "Pas de données Polygon (ticker non couvert ou marché fermé)" }
          }

          const { error: dbError } = await supabase
            .from("cours")
            .upsert(
              { ticker, prix: data.prix, date: data.date },
              { onConflict: "ticker,date" }
            )

          if (dbError) {
            return { ticker, status: "error", reason: dbError.message }
          }

          return { ticker, status: "ok", prix: data.prix, date: data.date }

        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          return { ticker, status: "error", reason: message }
        }
      })
    )

    results.push(...batchResults)

    // Pause entre les batchs (sauf après le dernier)
    if (i + BATCH_SIZE < TICKERS.length) {
      await sleep(BATCH_DELAY)
    }
  }

  // ── Résumé ─────────────────────────────────────────────────
  const summary = {
    duration_ms: Date.now() - startedAt,
    total:  results.length,
    ok:     results.filter((r) => r.status === "ok").length,
    skip:   results.filter((r) => r.status === "skip").length,
    errors: results.filter((r) => r.status === "error").length,
  }

  return NextResponse.json({
    summary,
    results,
  })
}

// Permet aussi un GET pratique pour tester depuis le navigateur en dev
export async function GET(request: NextRequest) {
  return POST(request)
}
