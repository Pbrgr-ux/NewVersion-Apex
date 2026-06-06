/**
 * POST /api/wild-card
 *
 * Appelé après la confirmation d'email d'un nouveau joueur.
 * Crée le portfolio de la saison courante avec le capital Wild Card.
 *
 * Wild Card = 100 000 × (1 + perf_moyenne_saison / 100)
 * Si inscrit en début de saison (sem ≤ 1) → capital normal 100 000.
 * Si hors saison → en attente de la prochaine saison.
 */

import { NextRequest, NextResponse }  from "next/server"
import { createClient }               from "@supabase/supabase-js"
import type { Database }              from "@/types/database"
import { getCurrentSeasonId, getCurrentSeasonData, computeWildCardCapital } from "@/lib/seasons"

export async function POST(req: NextRequest) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: "user_id manquant" }, { status: 400 })

  const seasonData = getCurrentSeasonData()
  const saisonId   = getCurrentSeasonId()

  // Si hors saison → pas de portfolio à créer maintenant
  if (seasonData.statut !== "active") {
    return NextResponse.json({ ok: true, statut: "hors_saison", message: "Prochaine saison à venir" })
  }

  // Calcul de la performance moyenne de la saison courante
  const { data: classementData } = await supabase
    .from("classement")
    .select("perf_totale")
    .eq("saison", saisonId)
    .eq("statut_joueur", "confirmed")

  const perfs       = (classementData ?? []).map((c) => Number(c.perf_totale))
  const perfMoyenne = perfs.length > 0 ? perfs.reduce((a, b) => a + b, 0) / perfs.length : 0

  // Semaine ≤ 1 → démarrage normal
  const isEarlySeason  = seasonData.semaine <= 1
  const capitalAjuste  = isEarlySeason ? 100_000 : computeWildCardCapital(perfMoyenne)
  const statutJoueur   = isEarlySeason ? "confirmed" : "rookie"

  // Vérifier si le portfolio existe déjà
  const { data: existing } = await supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", user_id)
    .eq("saison", saisonId)
    .is("league_id", null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, statut: "existe_deja" })
  }

  // Créer le portfolio
  const { error } = await supabase.from("portfolios").insert({
    user_id,
    saison:                  saisonId,
    cash:                    0,
    capital_initial:         100_000,
    capital_ajuste:          capitalAjuste,
    statut_joueur:           statutJoueur,
    date_inscription_saison: new Date().toISOString().split("T")[0],
  })

  if (error) {
    console.error("[wild-card]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok:             true,
    statut:         "cree",
    statut_joueur:  statutJoueur,
    capital_ajuste: capitalAjuste,
    perf_moyenne:   parseFloat(perfMoyenne.toFixed(2)),
    semaine:        seasonData.semaine,
    message:        statutJoueur === "rookie"
      ? `La saison est en cours (sem. ${seasonData.semaine}/13). Performance moyenne : ${perfMoyenne.toFixed(1)}%. Tu démarre avec ${capitalAjuste.toLocaleString("fr-FR")} €.`
      : "Bienvenue ! La saison démarre — tu pars avec 100 000 €.",
  })
}
