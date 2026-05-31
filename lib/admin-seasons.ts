/**
 * lib/admin-seasons.ts
 *
 * Fonctions server-side pour la gestion des saisons (admin only).
 * Utilise le client service_role pour bypasser RLS.
 */

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient }                        from "@supabase/supabase-js"
import type { Database }                       from "@/types/database"

export type SaisonRow = Database["public"]["Tables"]["saisons"]["Row"]
export type SaisonInsert = Database["public"]["Tables"]["saisons"]["Insert"]
export type SaisonUpdate = Database["public"]["Tables"]["saisons"]["Update"]

function adminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Vérifie que l'utilisateur connecté est admin. Lance une erreur sinon. */
export async function requireAdmin(): Promise<string> {
  const supabase                = await createServerClient()
  const { data: { user } }     = await supabase.auth.getUser()
  if (!user) throw new Error("Non connecté")

  const { data: dbUser }       = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!dbUser?.is_admin) throw new Error("Accès refusé")
  return user.id
}

/** Liste toutes les saisons triées par date de début DESC */
export async function getAllSaisons(): Promise<SaisonRow[]> {
  const admin = adminClient()
  const { data, error } = await admin
    .from("saisons")
    .select("*")
    .order("debut_date", { ascending: false })

  if (error) throw error
  return data ?? []
}

/** Récupère une saison par ID */
export async function getSaisonById(id: number): Promise<SaisonRow | null> {
  const admin = adminClient()
  const { data } = await admin
    .from("saisons")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  return data
}

/** Crée une nouvelle saison */
export async function createSaison(payload: SaisonInsert): Promise<SaisonRow> {
  const admin = adminClient()
  const { data, error } = await admin
    .from("saisons")
    .insert(payload)
    .select("*")
    .single()
  if (error) throw error
  return data
}

/** Met à jour une saison existante */
export async function updateSaison(id: number, payload: SaisonUpdate): Promise<SaisonRow> {
  const admin = adminClient()
  const { data, error } = await admin
    .from("saisons")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return data
}

/** Archive une saison (statut → terminee) */
export async function archiveSaison(id: number): Promise<void> {
  const admin = adminClient()
  const { error } = await admin
    .from("saisons")
    .update({ statut: "terminee" })
    .eq("id", id)
  if (error) throw error
}

/** Active une saison (statut → active) */
export async function activateSaison(id: number): Promise<void> {
  const admin = adminClient()
  const { error } = await admin
    .from("saisons")
    .update({ statut: "active" })
    .eq("id", id)
  if (error) throw error
}

/** Génère un code unique pour une nouvelle saison */
export function generateSaisonCode(type: string, existingCodes: string[]): string {
  if (type === "speciale") {
    let n = 1
    while (existingCodes.includes(`SP${n}`)) n++
    return `SP${n}`
  }
  // Trimestrielle : S1, S2, S3, S4, S5…
  const trimNumbers = existingCodes
    .filter((c) => /^S\d+$/.test(c))
    .map((c) => parseInt(c.slice(1), 10))
  const next = trimNumbers.length > 0 ? Math.max(...trimNumbers) + 1 : 1
  return `S${next}`
}

/** Stats d'une saison (nb joueurs, perf moyenne) */
export async function getSaisonStats(saisonId: number): Promise<{
  nb_joueurs: number
  perf_moyenne: number | null
}> {
  const admin = adminClient()
  const { data } = await admin
    .from("classement")
    .select("perf_totale")
    .eq("saison", saisonId)

  const rows  = data ?? []
  const perfs = rows.map((r) => Number(r.perf_totale))
  return {
    nb_joueurs:   rows.length,
    perf_moyenne: perfs.length > 0
      ? parseFloat((perfs.reduce((a, b) => a + b, 0) / perfs.length).toFixed(2))
      : null,
  }
}
