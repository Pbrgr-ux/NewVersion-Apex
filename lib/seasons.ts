/**
 * lib/seasons.ts
 *
 * Logique des saisons TradeLeague.
 * 4 saisons fixes de 13 semaines par an.
 *
 * Saison 1 : 6 jan  → 28 mar
 * Saison 2 : 7 avr  → 27 jun
 * Saison 3 : 7 jul  → 26 sep
 * Saison 4 : 6 oct  → 26 déc
 */

export type SeasonCode = "S1" | "S2" | "S3" | "S4"

export type SeasonData = {
  code:        SeasonCode
  id:          number       // 1-4
  label:       string       // "Saison 1 — 2026"
  debut:       string       // "YYYY-MM-DD"
  fin:         string       // "YYYY-MM-DD"
  statut:      "active" | "terminee" | "a_venir"
  semaine:     number       // semaine en cours (1-13)
  semainesTotal: number     // 13
  semainesRestantes: number
}

// ── Dates fixes (calculées pour 2026 et extensibles) ──────────
function buildSeasons(year: number): Omit<SeasonData, "statut" | "semaine" | "semainesRestantes">[] {
  // S1 : premier lundi de janvier proche du 6
  // On utilise les dates exactes du prompt
  return [
    {
      code: "S1", id: 1, label: `Saison 1 — ${year}`,
      debut: `${year}-01-06`, fin: `${year}-03-28`,
      semainesTotal: 13,
    },
    {
      code: "S2", id: 2, label: `Saison 2 — ${year}`,
      debut: `${year}-04-07`, fin: `${year}-06-27`,
      semainesTotal: 13,
    },
    {
      code: "S3", id: 3, label: `Saison 3 — ${year}`,
      debut: `${year}-07-07`, fin: `${year}-09-26`,
      semainesTotal: 13,
    },
    {
      code: "S4", id: 4, label: `Saison 4 — ${year}`,
      debut: `${year}-10-06`, fin: `${year}-12-26`,
      semainesTotal: 13,
    },
  ]
}

/** Retourne l'id de saison (1-4) pour une date donnée, ou null si hors saison */
function getSeasonIdForDate(dateStr: string, year: number): number | null {
  const seasons = buildSeasons(year)
  for (const s of seasons) {
    if (dateStr >= s.debut && dateStr <= s.fin) return s.id
  }
  return null
}

/** Numéro de semaine dans la saison (1-13) pour une date donnée */
function weekInSeason(dateStr: string, debutStr: string): number {
  const date  = new Date(dateStr)
  const debut = new Date(debutStr)
  const diffMs   = date.getTime() - debut.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.min(13, Math.max(1, Math.floor(diffDays / 7) + 1))
}

// ── API publique ──────────────────────────────────────────────

/**
 * Retourne la saison active à ce jour.
 * Si on est entre deux saisons (période de transition), retourne la dernière saison terminée.
 */
export function getCurrentSeasonData(): SeasonData {
  const now      = new Date()
  const today    = now.toISOString().split("T")[0]
  const year     = now.getFullYear()

  // Essayer l'année courante puis précédente
  for (const y of [year, year - 1]) {
    const seasons = buildSeasons(y)

    for (const s of seasons) {
      if (today >= s.debut && today <= s.fin) {
        const sem = weekInSeason(today, s.debut)
        return {
          ...s,
          statut:            "active",
          semaine:           sem,
          semainesRestantes: s.semainesTotal - sem,
        }
      }
    }

    // Entre deux saisons → chercher la prochaine saison à venir
    for (const s of seasons) {
      if (today < s.debut) {
        return {
          ...s,
          statut:            "a_venir",
          semaine:           0,
          semainesRestantes: s.semainesTotal,
        }
      }
    }
  }

  // Fallback : S4 de l'année courante
  const s4 = buildSeasons(year)[3]
  return { ...s4, statut: "terminee", semaine: 13, semainesRestantes: 0 }
}

/** Retourne le code "S1"…"S4" de la saison actuelle */
export function getCurrentSeason(): SeasonCode {
  return getCurrentSeasonData().code
}

/** Retourne l'id (1-4) de la saison actuelle (pour les requêtes DB) */
export function getCurrentSeasonId(): number {
  return getCurrentSeasonData().id
}

/**
 * Retourne toutes les saisons de l'année courante avec leur statut.
 */
export function getAllSeasonsData(): SeasonData[] {
  const now   = new Date()
  const today = now.toISOString().split("T")[0]
  const year  = now.getFullYear()

  return buildSeasons(year).map((s) => {
    if (today < s.debut) {
      return { ...s, statut: "a_venir",  semaine: 0,  semainesRestantes: s.semainesTotal }
    }
    if (today > s.fin) {
      return { ...s, statut: "terminee", semaine: 13, semainesRestantes: 0 }
    }
    const sem = weekInSeason(today, s.debut)
    return { ...s, statut: "active", semaine: sem, semainesRestantes: s.semainesTotal - sem }
  })
}

/**
 * Capital wild-card pour un nouveau joueur en cours de saison.
 * capital_wild_card = 100 000 × (1 + perf_moyenne)
 */
export function computeWildCardCapital(perfMoyenne: number): number {
  return Math.round(100_000 * (1 + perfMoyenne / 100))
}

/** Label court pour affichage (ex: "S2 2026") */
export function seasonLabel(saisonId: number, year?: number): string {
  const y = year ?? new Date().getFullYear()
  return `S${saisonId} ${y}`
}

/**
 * Récupère un Map saisonId → nom depuis la table saisons.
 * Fallback sur "Saison {code}" si le nom n'est pas défini.
 * À appeler côté serveur uniquement (utilise le client serveur Supabase).
 */
export async function getSaisonsNomMap(): Promise<Map<number, string>> {
  // Import dynamique pour éviter les dépendances circulaires
  const { createClient } = await import("@/lib/supabase/server")
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
