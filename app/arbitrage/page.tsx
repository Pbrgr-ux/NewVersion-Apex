import type { Metadata } from "next"
import { ArbitrageScreen } from "@/components/arbitrage-screen"

export const metadata: Metadata = {
  title: "Arbitrage Window | APEX",
  description: "Allocate your portfolio across 50 stocks during the arbitrage window.",
}

export default function ArbitragePage() {
  return <ArbitrageScreen />
}
