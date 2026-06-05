import type { Metadata } from "next"
import { redirect }       from "next/navigation"
import { LigueHubScreen } from "@/components/ligue-hub-screen"
import { getMyLeagues }   from "@/lib/leagues"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Private Leagues - TradeLeague",
  description: "Create or join a private league to compete with friends.",
}

export default async function LiguePage() {
  const { leagues, userId } = await getMyLeagues()
  if (!userId) redirect("/connexion")
  return <LigueHubScreen leagues={leagues} />
}
