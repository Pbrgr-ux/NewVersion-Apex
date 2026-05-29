"use client"

/**
 * useArbitrageWindow()
 *
 * Retourne l'état de la fenêtre d'arbitrage APEX en temps réel.
 * Fenêtre ouverte : samedi 08:00 → dimanche 21:00 (Europe/Paris)
 *
 * Toute la logique utilise Intl.DateTimeFormat avec le fuseau "Europe/Paris"
 * pour gérer correctement CET (UTC+1) et CEST (UTC+2) automatiquement.
 *
 * Retour :
 *   isOpen        — true si on est dans la fenêtre
 *   timeUntilOpen — compte à rebours avant la prochaine ouverture  (ex: "4j 22h 30m")
 *   timeUntilClose — compte à rebours avant la fermeture            (ex: "12:45:23")
 */

import { useState, useEffect } from "react"

export type ArbitrageWindowState = {
  isOpen:         boolean
  timeUntilOpen:  string
  timeUntilClose: string
}

// État initial identique côté serveur et client → pas de hydration mismatch
const INITIAL: ArbitrageWindowState = {
  isOpen:         false,
  timeUntilOpen:  "--:--:--",
  timeUntilClose: "--:--:--",
}

// ── Constantes ────────────────────────────────────────────────
const OPEN_SOD  = 8  * 3600   // samedi  08:00:00 (secondes depuis minuit)
const CLOSE_SOD = 21 * 3600   // dimanche 21:00:00

const DAY_SHORT: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

// ── Intl formatters (créés une seule fois) ─────────────────────
const parisFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Paris",
  weekday:  "short",
  hour:     "numeric",
  minute:   "numeric",
  second:   "numeric",
  hour12:   false,
})

/** Extrait les composantes de l'heure courante en Europe/Paris */
function getParisComponents(now: Date) {
  const parts = parisFormatter.formatToParts(now)
  const get   = (type: string) => parts.find((p) => p.type === type)?.value ?? "0"

  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Mon"
  return {
    day:    DAY_SHORT[weekdayStr] ?? 1,
    hour:   parseInt(get("hour"),   10),
    minute: parseInt(get("minute"), 10),
    second: parseInt(get("second"), 10),
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
  const { day, hour, minute, second } = getParisComponents(now)
  const currentSod = hour * 3600 + minute * 60 + second

  // Fenêtre ouverte : Samedi >= 08:00 OU Dimanche < 21:00
  const isOpen =
    (day === 6 && currentSod >= OPEN_SOD) ||
    (day === 0 && currentSod < CLOSE_SOD)

  if (isOpen) {
    // Temps restant jusqu'à Dimanche 21:00
    const secUntilClose =
      day === 6
        ? (86400 - currentSod) + CLOSE_SOD   // Samedi → minuit + 21h du dimanche
        : CLOSE_SOD - currentSod              // Dimanche → reste jusqu'à 21:00

    return {
      isOpen:         true,
      timeUntilOpen:  "--",
      timeUntilClose: formatDuration(Math.round(secUntilClose)),
    }
  }

  // Temps jusqu'à la prochaine ouverture (Samedi 08:00)
  let secUntilOpen: number
  if (day === 6) {
    // Samedi avant 08:00
    secUntilOpen = OPEN_SOD - currentSod
  } else if (day === 0) {
    // Dimanche après 21:00 → prochain samedi (6 jours)
    secUntilOpen = (86400 - currentSod) + 5 * 86400 + OPEN_SOD
  } else {
    // Lundi(1) → Vendredi(5)
    const daysLeft = 6 - day   // jours jusqu'au samedi
    secUntilOpen = (86400 - currentSod) + (daysLeft - 1) * 86400 + OPEN_SOD
  }

  return {
    isOpen:         false,
    timeUntilOpen:  formatDuration(Math.round(secUntilOpen)),
    timeUntilClose: "--",
  }
}

// ── Hook public ───────────────────────────────────────────────
export function useArbitrageWindow(): ArbitrageWindowState {
  const [state, setState] = useState<ArbitrageWindowState>(INITIAL)

  useEffect(() => {
    // Tick initial dès le montage côté client
    setState(computeState(new Date()))
    const id = setInterval(() => setState(computeState(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  return state
}
