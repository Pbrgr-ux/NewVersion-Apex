import { redirect }         from "next/navigation"
import { requireAdmin, getSaisonById, updateSaison, archiveSaison, activateSaison } from "@/lib/admin-seasons"
import { SaisonEditClient } from "@/components/admin/saison-edit-client"

export const dynamic = "force-dynamic"

export default async function EditSaisonPage({ params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch { redirect("/dashboard") }

  const { id } = await params
  const saison = await getSaisonById(parseInt(id, 10))
  if (!saison) redirect("/admin")

  return (
    <main className="min-h-svh bg-background px-4 py-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {saison.nom ?? saison.saison_code}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Edit the season parameters</p>
      </div>
      <SaisonEditClient saison={saison} />
    </main>
  )
}
