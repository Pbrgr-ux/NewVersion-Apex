import type { Metadata } from "next"
import { redirect }      from "next/navigation"
import { ProfilScreen }  from "@/components/profil-screen"
import { getProfilData } from "@/lib/profil-data"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Profil - TradeLeague",
  description: "Your player profile and performance history",
}

export default async function ProfilPage() {
  const data = await getProfilData()

  // Pas connecté → redirection
  if (!data) redirect("/connexion")

  return <ProfilScreen data={data} />
}
