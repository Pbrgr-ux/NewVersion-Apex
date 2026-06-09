/**
 * lib/public-profile.ts  (SERVER-ONLY)
 *
 * Résumé public d'un joueur pour la page de partage /u/[id] et l'image OG.
 * Lecture via service_role (page publique, sans session). AUCUNE position.
 */

import { createClient }      from "@supabase/supabase-js"
import type { Database }     from "@/types/database"
import { getCurrentSeasonId } from "@/lib/seasons"
import { getEffectivePro }    from "@/lib/pro"

function admin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type PublicProfile = {
  userId:      string
  pseudo:      string
  avatar:      string | null
  isPro:       boolean
  rang:        number | null
  total:       number
  seasonPerf:  number | null
  allTimePerf: number | null
  seasonNom:   string
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const db     = admin()
  const saison = getCurrentSeasonId()

  const { data: user } = await db
    .from("users")
    .select("id, pseudo, avatar, is_pro, pro_until")
    .eq("id", userId)
    .maybeSingle()
  if (!user) return null

  const [classRes, totalRes, palmRes, saisonRes] = await Promise.all([
    db.from("classement")
      .select("rang, perf_totale")
      .eq("user_id", userId)
      .eq("saison", saison)
      .maybeSingle(),
    db.from("classement")
      .select("id", { count: "exact", head: true })
      .eq("saison", saison)
      .eq("statut_joueur", "confirmed"),
    db.from("palmares_all_time")
      .select("perf_totale")
      .eq("user_id", userId),
    db.from("saisons")
      .select("nom, saison_code")
      .eq("id", saison)
      .maybeSingle(),
  ])

  const seasonNom = saisonRes.data?.nom?.trim() || `Season ${saisonRes.data?.saison_code ?? saison}`

  const seasonPerf = classRes.data?.perf_totale != null
    ? parseFloat(Number(classRes.data.perf_totale).toFixed(2))
    : null

  // Perf all-time composée : Π(1+perf) sur saisons terminées × saison courante
  let factor = 1
  let hasAllTime = false
  for (const p of (palmRes.data ?? []) as Array<{ perf_totale: number }>) {
    factor *= 1 + Number(p.perf_totale) / 100
    hasAllTime = true
  }
  if (seasonPerf != null) { factor *= 1 + seasonPerf / 100; hasAllTime = true }
  const allTimePerf = hasAllTime ? parseFloat(((factor - 1) * 100).toFixed(2)) : null

  return {
    userId:      user.id,
    pseudo:      user.pseudo,
    avatar:      user.avatar,
    isPro:       getEffectivePro(user),
    rang:        classRes.data?.rang ?? null,
    total:       totalRes.count ?? 0,
    seasonPerf,
    allTimePerf,
    seasonNom,
  }
}
