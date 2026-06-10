import { ImageResponse } from "next/og"
import { getPublicProfile } from "@/lib/public-profile"
import { buildCard } from "@/lib/share-card"

export const runtime = "nodejs"
export const alt = "TradeLeague player card"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getPublicProfile(id)
  const { element, width, height } = buildCard(p, "wide")
  return new ImageResponse(element, { width, height })
}
