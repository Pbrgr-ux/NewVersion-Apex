import type { Metadata } from "next"
import { redirect }      from "next/navigation"
import { createClient }  from "@/lib/supabase/server"
import { PulseScreen }   from "@/components/pulse-screen"
import { getPulseData }  from "@/lib/pulse-data"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pulse - TradeLeague",
  description: "Where the league is positioned this week.",
}

export default async function PulsePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/connexion")

  const data = await getPulseData()
  return <PulseScreen data={data} />
}
