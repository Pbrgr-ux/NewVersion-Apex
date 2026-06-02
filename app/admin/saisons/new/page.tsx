"use client"

import { useRouter }   from "next/navigation"
import { SaisonForm }  from "@/components/admin/saison-form"
import { createClient } from "@/lib/supabase/client"

export default function NewSaisonPage() {
  const router   = useRouter()
  const supabase = createClient()

  async function handleCreate(data: Parameters<typeof SaisonForm>[0]["onSubmit"] extends (d: infer D) => unknown ? D : never) {
    // Génère un code unique
    const { data: existing } = await supabase.from("saisons").select("saison_code")
    const codes = (existing ?? []).map((s: { saison_code: string }) => s.saison_code)
    const prefix = data.type === "speciale" ? "SP" : "S"
    let n = 1
    while (codes.includes(`${prefix}${n}`)) n++
    const saison_code = `${prefix}${n}`

    const { error } = await supabase.from("saisons").insert({
      ...data,
      saison_code,
      tickers_autorises: data.tickers_autorises.length > 0 ? data.tickers_autorises : null,
      fenetre_jours:     data.fenetre_jours,
    })
    if (error) throw new Error(error.message)
    router.push("/admin")
  }

  return (
    <main className="min-h-svh bg-background px-4 py-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">New season</h1>
        <p className="text-sm text-muted-foreground mt-1">Set up the season parameters</p>
      </div>
      <SaisonForm onSubmit={handleCreate} />
    </main>
  )
}
