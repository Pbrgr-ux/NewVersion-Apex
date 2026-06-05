/**
 * GET /api/update-news
 *
 * Récupère les dernières actus de chaque ticker via Yahoo Finance et les
 * upserte dans news_items. Déclenché par le cron quotidien (ou ?secret=).
 *
 * Pas de clé API, pas d'IA : titre + éditeur + lien + date.
 *
 * Protection : Authorization: Bearer <CRON_SECRET> ou ?secret=<CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient }              from "@supabase/supabase-js"
import type { Database }             from "@/types/database"
import { TICKERS }                   from "@/lib/tickers"
import { fetchNews }                 from "@/lib/yahoo-finance"

export const maxDuration = 60

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = req.headers.get("authorization")
  if (auth === `Bearer ${secret}`) return true
  return new URL(req.url).searchParams.get("secret") === secret
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), TICKERS.length) : TICKERS.length

  const start = Date.now()
  let inserted = 0

  // Fetch séquentiel léger (Yahoo search) pour les tickers demandés
  for (const t of TICKERS.slice(0, limit)) {
    const items = await fetchNews(t.yahooSymbol, t.ticker, 2)
    for (const it of items) {
      if (!it.url) continue
      const { error } = await db.from("news_items").upsert(
        { ticker: it.ticker, title: it.title, publisher: it.publisher, url: it.url, published_at: it.published_at },
        { onConflict: "url" }
      )
      if (!error) inserted++
    }
  }

  // Purge des actus de plus de 7 jours
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString()
  await db.from("news_items").delete().lt("published_at", weekAgo)

  const summary = { duration_ms: Date.now() - start, tickers: limit, upserts: inserted }
  console.log("[update-news]", JSON.stringify(summary))
  return NextResponse.json({ ok: true, summary })
}

export async function POST(request: NextRequest) { return GET(request) }
