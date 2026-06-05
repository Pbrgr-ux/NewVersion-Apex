import type { Metadata }     from "next"
import { redirect }          from "next/navigation"
import { getNewsroomData }   from "@/lib/newsroom-data"
import { NewsroomScreen }    from "@/components/newsroom-screen"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Newsroom - TradeLeague",
  description: "Daily briefing on the stocks that moved.",
}

export default async function NewsroomPage() {
  const data = await getNewsroomData()
  if (!data) redirect("/connexion")
  if (!data.isPro) redirect("/pro")

  return <NewsroomScreen items={data.items} />
}
