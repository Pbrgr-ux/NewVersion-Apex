import type { Metadata }        from "next"
import { ClassementScreen }      from "@/components/classement-screen"
import { getAllClassementData }   from "@/lib/classement-data"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title:       "Classement | TradeLeague",
  description: "Leaderboard de la saison en cours",
}

export default async function ClassementPage() {
  const data = await getAllClassementData()
  return <ClassementScreen data={data} />
}
