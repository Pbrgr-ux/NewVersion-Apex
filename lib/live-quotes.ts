/**
 * lib/live-quotes.ts  (SERVER-ONLY)
 *
 * Prix "temps réel" avec refresh lazy (compatible Vercel Hobby).
 * On lit quotes_live ; tout ticker dont le quote a > 20 min (ou absent)
 * est rafraîchi à la demande via Yahoo Finance, puis mis en cache.
 *
 * Garde anti-données-corrompues : un prix <= 0 est ignoré.
 */

import { createClient }   from "@supabase/supabase-js"
import type { Database }  from "@/types/database"
import { TICKER_MAP }     from "@/lib/tickers"
import { fetchBySymbolsPublic } from "@/lib/yahoo-finance"

const STALE_MS = 20 * 60 * 1000  // 20 minutes

function admin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Retourne un Map ticker → prix courant pour les tickers demandés.
 * Rafraîchit en base les quotes périmés (> 20 min).
 */
export async function getLiveQuotes(tickers: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  if (tickers.length === 0) return result

  const db = admin()
  const uniqueTickers = Array.from(new Set(tickers))

  // 1. Lire les quotes en cache
  const { data: cached } = await db
    .from("quotes_live")
    .select("ticker, prix, fetched_at")
    .in("ticker", uniqueTickers)

  const now = Date.now()
  const cachedMap = new Map<string, { prix: number; fetched_at: string }>()
  for (const q of cached ?? []) {
    cachedMap.set(q.ticker, { prix: Number(q.prix), fetched_at: q.fetched_at })
    result.set(q.ticker, Number(q.prix))
  }

  // 2. Déterminer les tickers à rafraîchir (absents ou périmés)
  const stale = uniqueTickers.filter((t) => {
    const c = cachedMap.get(t)
    if (!c) return true
    return now - new Date(c.fetched_at).getTime() > STALE_MS
  })

  if (stale.length === 0) return result

  // 3. Fetch Yahoo pour les tickers périmés (symboles Yahoo)
  const yahooSymbols = stale
    .map((t) => TICKER_MAP[t]?.yahooSymbol)
    .filter((s): s is string => !!s)

  const fetched = await fetchBySymbolsPublic(yahooSymbols)  // [{ ticker, prix, date }]
  if (fetched.length === 0) return result

  // 4. Upsert en base + mettre à jour le résultat
  const nowISO = new Date().toISOString()
  const rows = fetched
    .filter((f) => f.prix > 0)
    .map((f) => ({ ticker: f.ticker, prix: f.prix, fetched_at: nowISO }))

  if (rows.length > 0) {
    await db.from("quotes_live").upsert(rows, { onConflict: "ticker" })
    for (const r of rows) result.set(r.ticker, r.prix)
  }

  return result
}
