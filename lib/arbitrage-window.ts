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

export type ArbitrageWindowConfig = {
  jours:      number[]   // 0 = dim … 6 = sam
  heureDebut: number     // 0-23
  heureFin:   number     // 0-23
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

export function computeWindowState(now: Date, cfg: ArbitrageWindowConfig): ArbitrageWindowState {
  const jours = cfg.jours ?? []
  if (jours.length === 0) return INITIAL_WINDOW

  const { weekday, hour, minute, second } = getParisComponents(now)
  const sod      = hour * 3600 + minute * 60 + second
  const openSod  = cfg.heureDebut * 3600
  const closeSod = cfg.heureFin * 3600

  const isOpen = jours.includes(weekday) && sod >= openSod && sod < closeSod

  if (isOpen) {
    const secUntilClose  = closeSod - sod
    const windowCloseISO = new Date(now.getTime() + secUntilClose * 1000).toISOString()
    return {
      isOpen:         true,
      timeUntilOpen:  "--",
      timeUntilClose: formatDuration(Math.round(secUntilClose)),
      windowCloseISO,
    }
  }

  let secUntilOpen = Infinity
  for (let k = 0; k <= 7; k++) {
    const wd = (weekday + k) % 7
    if (!jours.includes(wd)) continue
    const sec = k * 86400 + openSod - sod
    if (sec > 0) { secUntilOpen = sec; break }
  }

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
