"use client"

/**
 * useArbitrageWindow()
 *
 * Retourne l'état de la fenêtre d'arbitrage en temps réel.
 *
 * ⚠️  MODE TEST — fenêtre journalière : 21:00 → 23:00 (Europe/Paris)
 * TODO : repasser en mode hebdo (sam 08:00 → dim 21:00) après les tests
 *        en restaurant la section « Constantes » et « computeState » d'origine.
 *
 * Toute la logique utilise Intl.DateTimeFormat avec le fuseau "Europe/Paris"
 * pour gérer correctement CET (UTC+1) et CEST (UTC+2) automatiquement.
 */

import { useState, useEffect } from "react"

export type ArbitrageWindowState = {
  isOpen:          boolean
  timeUntilOpen:   string
  timeUntilClose:  string
  windowCloseISO:  string | null   // ISO de la fermeture courante (null si fermée)
}

// État initial identique côté serveur et client → pas de hydration mismatch
const INITIAL: ArbitrageWindowState = {
  isOpen:         false,
  timeUntilOpen:  "--:--:--",
  timeUntilClose: "--:--:--",
  windowCloseISO: null,
}

// ── Constantes — MODE TEST (journalier 21h→23h) ───────────────
// TODO hebdo : OPEN_SOD = 8*3600 (sam 08:00) / CLOSE_SOD = 21*3600 (dim 21:00)
const OPEN_SOD  = 21 * 3600   // 21:00:00 (secondes depuis minuit)
const CLOSE_SOD = 23 * 3600   // 23:00:00

// ── Intl formatters (créés une seule fois) ─────────────────────
const parisFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Paris",
  hour:     "numeric",
  minute:   "numeric",
  second:   "numeric",
  hour12:   false,
})

/** Extrait les composantes de l'heure courante en Europe/Paris */
function getParisComponents(now: Date) {
  const parts = parisFormatter.formatToParts(now)
  const get   = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10)
  return {
    hour:   get("hour"),
    minute: get("minute"),
    second: get("second"),
  }
}

/** Formate un nombre de secondes en chaîne lisible */
function formatDuration(totalSec: number): string {
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

/** Calcule l'état complet de la fenêtre pour un instant donné */
function computeState(now: Date): ArbitrageWindowState {
  const { hour, minute, second } = getParisComponents(now)
  const currentSod = hour * 3600 + minute * 60 + second

  // Fenêtre ouverte chaque jour entre OPEN_SOD et CLOSE_SOD
  const isOpen = currentSod >= OPEN_SOD && currentSod < CLOSE_SOD

  if (isOpen) {
    const secUntilClose  = CLOSE_SOD - currentSod
    const windowCloseISO = new Date(now.getTime() + secUntilClose * 1000).toISOString()

    return {
      isOpen:          true,
      timeUntilOpen:   "--",
      timeUntilClose:  formatDuration(Math.round(secUntilClose)),
      windowCloseISO,
    }
  }

  // Temps jusqu'à la prochaine ouverture (21:00 aujourd'hui ou demain)
  const secUntilOpen = currentSod < OPEN_SOD
    ? OPEN_SOD - currentSod                   // plus tard aujourd'hui
    : (86400 - currentSod) + OPEN_SOD         // demain à 21:00

  return {
    isOpen:          false,
    timeUntilOpen:   formatDuration(Math.round(secUntilOpen)),
    timeUntilClose:  "--",
    windowCloseISO:  null,
  }
}

// ── Hook public ───────────────────────────────────────────────
export function useArbitrageWindow(): ArbitrageWindowState {
  const [state, setState] = useState<ArbitrageWindowState>(INITIAL)

  useEffect(() => {
    setState(computeState(new Date()))
    const id = setInterval(() => setState(computeState(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  return state
}
