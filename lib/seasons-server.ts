/**
 * lib/seasons-server.ts
 *
 * Fonctions saisons SERVER-ONLY (importent le client serveur Supabase).
 * Ne JAMAIS importer depuis un composant client.
 */

import { createClient } from "@/lib/supabase/server"
import { getCurrentSeasonId } from "@/lib/seasons"
import { MAIN_WINDOW, type ArbitrageWindowConfig } from "@/lib/arbitrage-window"

/**
 * Fenêtre d'arbitrage du jeu principal = config de la saison active
 * (table saisons). Fallback sur MAIN_WINDOW si non définie.
 * Rend la fenêtre du jeu principal paramétrable depuis l'admin, comme les ligues.
 */
export async function getActiveSeasonWindow(): Promise<ArbitrageWindowConfig> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("saisons")
    .select("fenetre_jours, fenetre_heure_debut, fenetre_heure_fin")
    .eq("id", getCurrentSeasonId())
    .maybeSingle()
  if (!data) return MAIN_WINDOW
  return {
    jours:      data.fenetre_jours && data.fenetre_jours.length > 0 ? data.fenetre_jours : MAIN_WINDOW.jours,
    heureDebut: data.fenetre_heure_debut ?? MAIN_WINDOW.heureDebut,
    heureFin:   data.fenetre_heure_fin   ?? MAIN_WINDOW.heureFin,
  }
}

/**
 * Récupère un Map saisonId → nom depuis la table saisons.
 * Fallback sur "Saison {code}" si le nom n'est pas défini.
 */
export async function getSaisonsNomMap(): Promise<Map<number, string>> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("saisons")
    .select("id, nom, saison_code")

  const map = new Map<number, string>()
  for (const s of (data ?? []) as Array<{ id: number; nom: string | null; saison_code: string }>) {
    map.set(s.id, s.nom?.trim() || `Saison ${s.saison_code}`)
  }
  return map
}
