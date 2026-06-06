/**
 * lib/perf.ts
 *
 * Helpers de calcul de performance réutilisés par le dashboard (jeu principal)
 * et les ligues. Retours chaînés : Π(1 + rendement de chaque arbitrage) − 1.
 */

/** Position minimale nécessaire au calcul de perf chaînée. */
export type PerfPosition = {
  ticker:         string
  allocation_pct: number
  open_price:     number | null
  close_price:    number | null
  status:         string          // 'open' | 'closed'
  opened_at:      string | null
}

/**
 * Contribution pondérée d'une position au rendement (%), avec garde anti-corruption.
 * Renvoie null si la donnée est manquante ou aberrante (ratio hors [0.1, 10]).
 */
export function safeContribution(
  current: number | null,
  past:    number | null,
  weight:  number,
): number | null {
  if (current == null || past == null || past <= 0) return null
  const ratio = current / past
  if (ratio > 10 || ratio < 0.1) return null
  return weight * (ratio - 1) * 100
}

/**
 * Perf composée d'un ensemble de positions, en chaînant les "batches"
 * (positions ouvertes au même instant `opened_at`).
 *   • position fermée  → prix de fin = close_price
 *   • position ouverte → prix de fin = quote temps réel (liveQuotes)
 * Renvoie null si aucune donnée exploitable.
 */
export function computeChainedPerf(
  positions:  PerfPosition[],
  liveQuotes: Map<string, number>,
): number | null {
  if (positions.length === 0) return null

  const batches = new Map<string, PerfPosition[]>()
  for (const p of positions) {
    const key = p.opened_at ?? "—"
    if (!batches.has(key)) batches.set(key, [])
    batches.get(key)!.push(p)
  }

  let factor = 1
  let hasData = false
  for (const batch of batches.values()) {
    let batchReturn = 0
    let batchHas    = false
    for (const p of batch) {
      const w         = Number(p.allocation_pct) / 100
      const openPrice = p.open_price != null ? Number(p.open_price) : null
      const endPrice  = p.status === "closed"
        ? (p.close_price != null ? Number(p.close_price) : null)
        : (liveQuotes.get(p.ticker) ?? null)
      const c = safeContribution(endPrice, openPrice, w)
      if (c != null) { batchReturn += c; batchHas = true }
    }
    if (batchHas) { factor *= 1 + batchReturn / 100; hasData = true }
  }

  return hasData ? parseFloat(((factor - 1) * 100).toFixed(2)) : null
}
