"use client"

import Link from "next/link"
import type { SaisonRow } from "@/lib/admin-seasons"

type Props = {
  saison: SaisonRow & { nb_joueurs: number; perf_moyenne: number | null }
}

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

export function AdminSaisonCard({ saison: s }: Props) {
  const jourLabels = (s.fenetre_jours ?? [])
    .map((j) => JOURS[j] ?? j)
    .join(", ")

  const statusColor =
    s.statut === "active"   ? "text-green-500 bg-green-500/10 border-green-500/20" :
    s.statut === "a_venir"  ? "text-blue-500 bg-blue-500/10 border-blue-500/20"   :
    "text-muted-foreground bg-secondary border-border"

  const typeColor =
    s.type === "speciale" ? "text-amber-500 bg-amber-500/10" : "text-primary bg-primary/10"

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-foreground">{s.nom ?? s.saison_code}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
              {s.statut === "active" ? "En cours" : s.statut === "a_venir" ? "À venir" : "Terminée"}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>
              {s.type === "speciale" ? "Spéciale" : "Trimestrielle"}
            </span>
            {s.inscription_requise && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-muted-foreground bg-secondary">
                Optionnelle
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(s.debut_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
            {" → "}
            {new Date(s.fin_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <Link
          href={`/admin/saisons/${s.id}`}
          className="shrink-0 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card"
        >
          Modifier
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="rounded-lg bg-secondary/50 py-1.5">
          <p className="text-lg font-bold text-foreground">{s.nb_joueurs}</p>
          <p className="text-xs text-muted-foreground">Joueurs</p>
        </div>
        <div className="rounded-lg bg-secondary/50 py-1.5">
          <p className="text-lg font-bold text-foreground">
            {s.capital_initial.toLocaleString("fr-FR")} €
          </p>
          <p className="text-xs text-muted-foreground">Capital</p>
        </div>
        <div className="rounded-lg bg-secondary/50 py-1.5">
          <p className={`text-lg font-bold ${s.perf_moyenne != null ? (s.perf_moyenne >= 0 ? "text-green-500" : "text-red-500") : "text-muted-foreground"}`}>
            {s.perf_moyenne != null ? `${s.perf_moyenne >= 0 ? "+" : ""}${s.perf_moyenne}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Perf moy.</p>
        </div>
      </div>

      {/* Config fenêtre */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span>🗓 {jourLabels || "—"}</span>
        <span>🕐 {s.fenetre_heure_debut}h00 → {s.fenetre_heure_fin}h00</span>
        <span>📊 Max {s.max_allocation_pct}% / action</span>
        {s.tickers_autorises && (
          <span>🎯 {s.tickers_autorises.length} tickers</span>
        )}
      </div>
    </div>
  )
}
