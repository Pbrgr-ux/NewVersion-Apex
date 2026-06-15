/**
 * lib/arbitrage-window.ts  (isomorphe — utilisable client ET serveur)
 *
 * Logique pure de la fenêtre d'arbitrage : ouverture selon des jours/heures
 * configurables (par défaut = jeu principal). Le hook React `useArbitrageWindow`
 * consomme ces helpers ; l'API `/api/arbitrate` réutilise `isWindowOpen` pour
 * valider côté serveur.
 *
 * Sémantique : ouverte sur chaque jour de `jours` (0 = dim … 6 = sam), entre
 * `heureDebut`h00 et `heureFin`h00 (intervalle par jour, fuseau Europe/Paris).
 */

// Intervalle avancé : jours + heures, avec passage minuit si fin <= debut.
// Permet des fenêtres différentes selon le jour (ex. semaine la nuit, dimanche en journée).
export type WindowInterval = {
  jours: number[]   // 0 = dim … 6 = sam
  debut: number     // 0-23
  fin:   number     // 1-24 ; si fin <= debut → la fenêtre passe minuit (se termine le lendemain)
}

export type ArbitrageWindowConfig = {
  jours:      number[]   // 0 = dim … 6 = sam   (modèle simple)
  heureDebut: number     // 0-23
  heureFin:   number     // 0-24
  intervals?: WindowInterval[]   // si présent et non vide → prioritaire (multi-intervalles + passage minuit)
}

export type ArbitrageWindowState = {
  isOpen:         boolean
  timeUntilOpen:  string
  timeUntilClose: string
  windowCloseISO: string | null
}

// Fenêtre par défaut = jeu principal (week-end 08:00 → 21:00)
export const MAIN_WINDOW: ArbitrageWindowConfig = {
  jours:      [6, 0],
  heureDebut: 8,
  heureFin:   21,
}

export const INITIAL_WINDOW: ArbitrageWindowState = {
  isOpen:         false,
  timeUntilOpen:  "--:--:--",
  timeUntilClose: "--:--:--",
  windowCloseISO: null,
}

const parisFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Paris",
  weekday:  "short",
  hour:     "numeric",
  minute:   "numeric",
  second:   "numeric",
  hour12:   false,
})

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

function getParisComponents(now: Date) {
  const parts = parisFormatter.formatToParts(now)
  const get   = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  const num   = (type: string) => parseInt(get(type) || "0", 10)
  return {
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
    hour:    num("hour") % 24,
    minute:  num("minute"),
    second:  num("second"),
  }
}

export function formatDuration(totalSec: number): string {
  if (totalSec <= 0) return "00:00:00"
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) {
    return `${d}j ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// Normalise la config en liste d'intervalles (le modèle simple = 1 intervalle).
function toIntervals(cfg: ArbitrageWindowConfig): WindowInterval[] {
  if (cfg.intervals && cfg.intervals.length > 0) return cfg.intervals
  return [{ jours: cfg.jours ?? [], debut: cfg.heureDebut, fin: cfg.heureFin }]
}

export function computeWindowState(now: Date, cfg: ArbitrageWindowConfig): ArbitrageWindowState {
  const intervals = toIntervals(cfg).filter((iv) => iv.jours?.length > 0 && iv.fin !== iv.debut)
  if (intervals.length === 0) return INITIAL_WINDOW

  const { weekday, hour, minute, second } = getParisComponents(now)
  const sod = hour * 3600 + minute * 60 + second

  // Matérialise toutes les occurrences sur [-1j, +8j] en secondes depuis maintenant.
  // Gère le passage minuit (fin <= debut → la fenêtre se prolonge le lendemain).
  const ranges: { start: number; end: number }[] = []
  for (const iv of intervals) {
    const wrap   = iv.fin <= iv.debut
    const durSec = ((wrap ? iv.fin + 24 : iv.fin) - iv.debut) * 3600
    for (let k = -1; k <= 8; k++) {
      const wd = (((weekday + k) % 7) + 7) % 7
      if (!iv.jours.includes(wd)) continue
      const start = k * 86400 + iv.debut * 3600 - sod
      ranges.push({ start, end: start + durSec })
    }
  }

  // Ouvert maintenant ? (+ fusion des plages contiguës pour la fermeture)
  let curEnd = -Infinity
  for (const r of ranges) if (r.start <= 0 && r.end > 0) curEnd = Math.max(curEnd, r.end)
  if (curEnd > 0) {
    let extended = true
    while (extended) {
      extended = false
      for (const r of ranges) if (r.start <= curEnd && r.end > curEnd) { curEnd = r.end; extended = true }
    }
    const secUntilClose = Math.round(curEnd)
    return {
      isOpen:         true,
      timeUntilOpen:  "--",
      timeUntilClose: formatDuration(secUntilClose),
      windowCloseISO: new Date(now.getTime() + secUntilClose * 1000).toISOString(),
    }
  }

  // Prochaine ouverture
  let secUntilOpen = Infinity
  for (const r of ranges) if (r.start > 0) secUntilOpen = Math.min(secUntilOpen, r.start)

  return {
    isOpen:         false,
    timeUntilOpen:  secUntilOpen === Infinity ? "--:--:--" : formatDuration(Math.round(secUntilOpen)),
    timeUntilClose: "--",
    windowCloseISO: null,
  }
}

/** Validation serveur : la fenêtre est-elle ouverte à `now` pour cette config ? */
export function isWindowOpen(now: Date, cfg: ArbitrageWindowConfig): boolean {
  return computeWindowState(now, cfg).isOpen
}
