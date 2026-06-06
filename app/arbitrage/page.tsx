import type { Metadata } from "next"
import { ArbitrageScreen } from "@/components/arbitrage-screen"
import { getMyLeagueContexts } from "@/lib/leagues"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Arbitrage Window | TradeLeague",
  description: "Allocate your portfolio across 50 stocks during the arbitrage window.",
}

export default async function ArbitragePage({ searchParams }: { searchParams: Promise<{ league?: string }> }) {
  const { league } = await searchParams
  const leagueContexts = await getMyLeagueContexts()
  const initialLeagueId = league && leagueContexts.some((l) => l.id === league) ? league : null
  return <ArbitrageScreen leagueContexts={leagueContexts} initialLeagueId={initialLeagueId} />
}
