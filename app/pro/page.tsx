import type { Metadata } from "next"
import { PaywallScreen } from "@/components/paywall-screen"

export const metadata: Metadata = {
  title: "APEX Pro - Passez au niveau supérieur",
  description: "Débloquez les stats avancées, les ligues privées et une expérience sans publicité pour 2,99€/mois.",
}

export default function ProPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  return <PaywallScreen />
}
