/**
 * lib/seasons-server.ts
 *
 * Fonctions saisons SERVER-ONLY (importent le client serveur Supabase).
 * Ne JAMAIS importer depuis un composant client.
 */

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { getCurrentSeasonId } from "@/lib/seasons"
import { MAIN_WINDOW, type ArbitrageWindowConfig, type WindowInterval } from "@/lib/arbitrage-window"

/**
 * Override avancé de la fenêtre (intervalles par jour + passage minuit),
 * stocké dans app_config (clé "arbitrage_window", valeur = JSON d'intervalles).
 * Lu via service_role (app_config est en RLS sans policy publique).
 * NULL/absent → pas d'override (on garde la fenêtre simple de la saison).
 */
async function getWindowIntervalsOverride(): Promise<WindowInterval[] | null> {
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await admin.from("app_config").select("value").eq("key", "arbitrage_window").maybeSingle()
    if (!data?.value) return null
    const parsed = JSON.parse(data.value)
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as WindowInterval[]) : null
  } catch {
    return null
  }
}

/**
 * Fenêtre d'arbitrage du jeu principal = config de la saison active
 * (table saisons). Fallback sur MAIN_WINDOW si non définie.
 * Un override avancé (app_config "arbitrage_window") peut imposer des intervalles
 * par jour avec passage minuit (utilisé en beta).
 */
export async function getActiveSeasonWindow(): Promise<ArbitrageWindowConfig> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("saisons")
    .select("fenetre_jours, fenetre_heure_debut, fenetre_heure_fin")
    .eq("id", getCurrentSeasonId())
    .maybeSingle()

  const base: ArbitrageWindowConfig = data
    ? {
        jours:      data.fenetre_jours && data.fenetre_jours.length > 0 ? data.fenetre_jours : MAIN_WINDOW.jours,
        heureDebut: data.fenetre_heure_debut ?? MAIN_WINDOW.heureDebut,
        heureFin:   data.fenetre_heure_fin   ?? MAIN_WINDOW.heureFin,
      }
    : { ...MAIN_WINDOW }

  const intervals = await getWindowIntervalsOverride()
  if (intervals) base.intervals = intervals

  return base
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
