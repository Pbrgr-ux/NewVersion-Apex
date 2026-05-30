import type { Metadata } from "next"
import { LigueScreen } from "@/components/ligue-screen"

export const metadata: Metadata = {
  title: "Ligue Privée - TradeLeague",
  description: "Classement interne de ta ligue privée.",
}

export default async function LigueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LigueScreen id={id} />
}
