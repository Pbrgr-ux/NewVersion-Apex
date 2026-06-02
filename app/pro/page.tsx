import type { Metadata } from "next"
import { PaywallScreen } from "@/components/paywall-screen"

export const metadata: Metadata = {
  title: "TradeLeague Pro — Level up",
  description: "Unlock advanced stats, private leagues and an ad-free experience for €2.99/month.",
}

export default function ProPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  return <PaywallScreen />
}
