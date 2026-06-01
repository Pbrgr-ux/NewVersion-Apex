/**
 * lib/seasons-server.ts
 *
 * Fonctions saisons SERVER-ONLY (importent le client serveur Supabase).
 * Ne JAMAIS importer depuis un composant client.
 */

import { createClient } from "@/lib/supabase/server"

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
