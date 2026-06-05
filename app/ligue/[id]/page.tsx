import type { Metadata }   from "next"
import { redirect }        from "next/navigation"
import { LigueScreen }     from "@/components/ligue-screen"
import { getLeagueDetail } from "@/lib/leagues"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Private League - TradeLeague",
  description: "Your private league standings.",
}

export default async function LigueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getLeagueDetail(id)
  if (!detail) redirect("/ligue")
  return <LigueScreen detail={detail} />
}
