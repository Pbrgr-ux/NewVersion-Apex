import type { Metadata } from "next"
import { LigueScreen } from "@/components/ligue-screen"

export const metadata: Metadata = {
  title: "Private League - TradeLeague",
  description: "Your private league standings.",
}

export default async function LigueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LigueScreen id={id} />
}
