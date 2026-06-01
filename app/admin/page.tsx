import { redirect }        from "next/navigation"
import Link               from "next/link"
import { requireAdmin, getAllSaisons, getSaisonStats } from "@/lib/admin-seasons"
import { AdminSaisonCard } from "@/components/admin/admin-saison-card"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  try { await requireAdmin() } catch { redirect("/dashboard") }

  const saisons = await getAllSaisons()
  const stats   = await Promise.all(saisons.map((s) => getSaisonStats(s.id)))

  const saisonsWithStats = saisons.map((s, i) => ({ ...s, ...stats[i] }))

  const active   = saisonsWithStats.filter((s) => s.statut === "active")
  const aVenir   = saisonsWithStats.filter((s) => s.statut === "a_venir")
  const termines = saisonsWithStats.filter((s) => s.statut === "terminee")

  return (
    <main className="min-h-svh bg-background px-4 py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-sm font-bold text-foreground">Administration</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestion des saisons TradeLeague</p>
        </div>
        <Link
          href="/admin/saisons/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          + Nouvelle saison
        </Link>
      </div>

      {/* Saisons actives */}
      {active.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-green-500 mb-3">
            ● En cours ({active.length})
          </h2>
          <div className="flex flex-col gap-3">
            {active.map((s) => <AdminSaisonCard key={s.id} saison={s} />)}
          </div>
        </section>
      )}

      {/* À venir */}
      {aVenir.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            À venir ({aVenir.length})
          </h2>
          <div className="flex flex-col gap-3">
            {aVenir.map((s) => <AdminSaisonCard key={s.id} saison={s} />)}
          </div>
        </section>
      )}

      {/* Terminées */}
      {termines.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Terminées ({termines.length})
          </h2>
          <div className="flex flex-col gap-3">
            {termines.map((s) => <AdminSaisonCard key={s.id} saison={s} />)}
          </div>
        </section>
      )}

      {saisons.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          Aucune saison — <Link href="/admin/saisons/new" className="text-primary underline">Créer la première</Link>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour au dashboard
        </Link>
      </div>
    </main>
  )
}
