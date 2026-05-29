/**
 * lib/yahoo-finance.ts
 *
 * Wrapper Yahoo Finance pour APEX.
 * Remplace l'intégration Polygon.io — gratuit, sans clé API.
 *
 * Délai des données : ~15 min (actions US) / clôture J (actions EU)
 * Pour un jeu à fenêtre hebdomadaire, ce délai est largement acceptable.
 *
 * Fréquence recommandée :
 *   Vercel Hobby : 1 sync/jour à 22h30 UTC (après clôture US)
 *   Vercel Pro   : toutes les 15 min pendant les heures de marché
 *                  → schedule : "0,15,30,45 7-22 * * 1-5"
 */

// yahoo-finance2 v3 exporte une CLASSE (pas une instance)
// → import default = classe, instancier avec new
import YahooFinanceClass from "yahoo-finance2"
import { TICKERS, YAHOO_TO_TICKER } from "./tickers"

// Instance unique réutilisée (suppressNotices évite le message survey au démarrage)
const yf = new (YahooFinanceClass as unknown as new (opts?: object) => {
  quote(
    symbols: string | string[],
    queryOptions?: object,
    moduleOptions?: object
  ): Promise<unknown>
})({ suppressNotices: ["yahooSurvey"] })

export type FetchedPrice = {
  ticker: string   // symbole interne (clé en base)
  prix:   number   // prix en devise locale de la place
  date:   string   // ISO "YYYY-MM-DD" de la dernière cotation
}

// Type minimal pour les champs utilisés (yahoo-finance2 peut retourner `never`
// quand validateResult:false est actif — on cast explicitement)
type YQuote = {
  symbol:               string
  regularMarketPrice?:  number | null
  regularMarketTime?:   Date | number | null
}

function extractDate(time: Date | number | null | undefined): string {
  if (!time) return new Date().toISOString().split("T")[0]
  const d = time instanceof Date ? time : new Date(time)
  return d.toISOString().split("T")[0]
}

function toQuoteArray(raw: unknown): YQuote[] {
  if (Array.isArray(raw)) return raw as YQuote[]
  if (raw && typeof raw === "object") return [raw as YQuote]
  return []
}

/**
 * Récupère les cours actuels de tous les tickers APEX en un seul batch.
 * Yahoo Finance ne nécessite aucune clé API et n'impose pas de rate limit
 * pour une utilisation raisonnable.
 */
export async function fetchAllPrices(): Promise<FetchedPrice[]> {
  const yahooSymbols = TICKERS.map((t) => t.yahooSymbol)
  return fetchBySymbols(yahooSymbols)
}

/**
 * Variante pour tester sur un sous-ensemble de tickers (paramètre ?limit=N).
 */
export async function fetchPrices(limit: number): Promise<FetchedPrice[]> {
  const yahooSymbols = TICKERS.slice(0, limit).map((t) => t.yahooSymbol)
  return fetchBySymbols(yahooSymbols)
}

async function fetchBySymbols(symbols: string[]): Promise<FetchedPrice[]> {
  if (symbols.length === 0) return []

  let raw: unknown
  try {
    raw = await yf.quote(symbols, {}, { validateResult: false })
  } catch (err) {
    console.error("[yahoo-finance] Erreur batch quote:", err)
    return []
  }

  const quotes = toQuoteArray(raw)
  const results: FetchedPrice[] = []

  for (const q of quotes) {
    if (!q || q.regularMarketPrice == null) continue

    const internalTicker = YAHOO_TO_TICKER[q.symbol]
    if (!internalTicker) continue

    results.push({
      ticker: internalTicker,
      prix:   q.regularMarketPrice,
      date:   extractDate(q.regularMarketTime),
    })
  }

  return results
}
