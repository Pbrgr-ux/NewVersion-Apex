import type { Metadata } from "next"
import { LigueHubScreen } from "@/components/ligue-hub-screen"

export const metadata: Metadata = {
  title: "Ligues Privées - APEX",
  description: "Crée ou rejoins une ligue privée pour compéter entre amis.",
}

export default function LiguePage() {
  return <LigueHubScreen />
}
