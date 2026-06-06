"use client"

/**
 * useArbitrageWindow(config?)
 *
 * État temps réel de la fenêtre d'arbitrage pour une config donnée.
 * Sans argument → jeu principal (MAIN_WINDOW). Une ligue passe sa propre config.
 * Logique pure dans lib/arbitrage-window.ts (partagée avec l'API serveur).
 */

import { useState, useEffect } from "react"
import {
  MAIN_WINDOW,
  INITIAL_WINDOW,
  computeWindowState,
  type ArbitrageWindowConfig,
  type ArbitrageWindowState,
} from "@/lib/arbitrage-window"

export type { ArbitrageWindowConfig, ArbitrageWindowState }
export { MAIN_WINDOW }

export function useArbitrageWindow(config: ArbitrageWindowConfig = MAIN_WINDOW): ArbitrageWindowState {
  const [state, setState] = useState<ArbitrageWindowState>(INITIAL_WINDOW)

  const key = `${config.jours.join(",")}|${config.heureDebut}|${config.heureFin}`

  useEffect(() => {
    setState(computeWindowState(new Date(), config))
    const id = setInterval(() => setState(computeWindowState(new Date(), config)), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}
