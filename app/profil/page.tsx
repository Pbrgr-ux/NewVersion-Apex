import type { Metadata } from "next"
import { ProfilScreen } from "@/components/profil-screen"

export const metadata: Metadata = {
  title: "Profil - APEX",
  description: "Your player profile and performance history",
}

export default function ProfilPage() {
  return <ProfilScreen />
}
