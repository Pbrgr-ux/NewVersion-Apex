import type { Metadata } from "next"
import { LigueHubScreen } from "@/components/ligue-hub-screen"

export const metadata: Metadata = {
  title: "Private Leagues - TradeLeague",
  description: "Create or join a private league to compete with friends.",
}

export default function LiguePage() {
  return <LigueHubScreen />
}
