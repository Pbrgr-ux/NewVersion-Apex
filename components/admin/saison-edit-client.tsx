"use client"

import { useState }    from "react"
import { useRouter }   from "next/navigation"
import { SaisonForm }  from "@/components/admin/saison-form"
import { createClient } from "@/lib/supabase/client"
import type { SaisonRow } from "@/lib/admin-seasons"

export function SaisonEditClient({ saison }: { saison: SaisonRow }) {
  const router   = useRouter()
  const supabase = createClient()
  const [toggling, setToggling] = useState(false)
  const [msg, setMsg]           = useState<string | null>(null)

  async function handleUpdate(data: Parameters<typeof SaisonForm>[0]["onSubmit"] extends (d: infer D) => unknown ? D : never) {
    const { error } = await supabase.from("saisons").update({
      ...data,
      tickers_autorises: data.tickers_autorises.length > 0 ? data.tickers_autorises : null,
    }).eq("id", saison.id)
    if (error) throw new Error(error.message)
    router.push("/admin")
  }

  async function toggleStatut() {
    setToggling(true)
    const newStatut = saison.statut === "active" ? "terminee" : "active"
    const { error } = await supabase.from("saisons").update({ statut: newStatut }).eq("id", saison.id)
    setToggling(false)
    if (error) { setMsg(error.message); return }
    setMsg(newStatut === "active" ? "✅ Season activated" : "✅ Season archived")
    setTimeout(() => { router.push("/admin"); router.refresh() }, 800)
  }

  return (
    <div className="space-y-6">
      {/* Bouton toggle statut */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Status: <span className={saison.statut === "active" ? "text-green-500" : "text-muted-foreground"}>
              {saison.statut === "active" ? "Active" : saison.statut === "a_venir" ? "Upcoming" : "Ended"}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {saison.statut === "active" ? "Click to archive this season" : "Click to activate this season"}
          </p>
        </div>
        <button
          onClick={toggleStatut}
          disabled={toggling}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
            saison.statut === "active"
              ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
              : "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"
          }`}
        >
          {toggling ? "…" : saison.statut === "active" ? "Archive" : "Activate"}
        </button>
      </div>

      {msg && <p className="text-sm text-green-500 font-medium">{msg}</p>}

      <SaisonForm saison={saison} onSubmit={handleUpdate} />
    </div>
  )
}
