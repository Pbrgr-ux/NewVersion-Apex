import type { Metadata } from "next"
import { ArbitrageScreen } from "@/components/arbitrage-screen"
import { getActiveSeasonWindow } from "@/lib/seasons-server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Arbitrage Window | TradeLeague",
  description: "Allocate your portfolio across 50 stocks during the arbitrage window.",
}

export default async function ArbitragePage() {
  const mainWindow = await getActiveSeasonWindow()
  return <ArbitrageScreen mainWindow={mainWindow} />
}
