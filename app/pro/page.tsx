import type { Metadata } from "next"
import { PaywallScreen } from "@/components/paywall-screen"

export const metadata: Metadata = {
  title: "TradeLeague Pro — Level up",
  description: "Unlock advanced stats, the daily newsroom and your Floor rivals' positions for €2.99/month.",
}

export default function ProPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  return <PaywallScreen />
}
