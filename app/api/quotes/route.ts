/**
 * GET /api/quotes
 *
 * Renvoie les prix temps réel (cache lazy ≤ 20 min) de tous les tickers
 * APEX. Utilisé par la page d'arbitrage pour afficher les vrais prix
 * (cohérents avec la fiche action détaillée).
 */

import { NextResponse }   from "next/server"
import { TICKERS }        from "@/lib/tickers"
import { getLiveQuotes }  from "@/lib/live-quotes"

export const dynamic = "force-dynamic"

export async function GET() {
  const quotes = await getLiveQuotes(TICKERS.map((t) => t.ticker))
  const out: Record<string, number> = {}
  for (const [ticker, prix] of quotes.entries()) out[ticker] = prix
  return NextResponse.json({ quotes: out })
}
