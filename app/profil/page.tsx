import type { Metadata } from "next"
import { ProfilScreen } from "@/components/profil-screen"

export const metadata: Metadata = {
  title: "Profil - TradeLeague",
  description: "Your player profile and performance history",
}

export default function ProfilPage() {
  return <ProfilScreen />
}
