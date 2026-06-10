import type { Metadata } from "next"
import { redirect }        from "next/navigation"
import { FloorsHubScreen } from "@/components/floors-hub-screen"
import { getMyFloors }     from "@/lib/floors"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Floors - TradeLeague",
  description: "Private floors — compete with friends on the Major League leaderboard.",
}

export default async function FloorsPage() {
  const { floors, userId } = await getMyFloors()
  if (!userId) redirect("/connexion")
  return <FloorsHubScreen floors={floors} />
}
