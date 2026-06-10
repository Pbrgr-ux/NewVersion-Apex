import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { getPublicProfile } from "@/lib/public-profile"
import { buildCard, type CardFormat } from "@/lib/share-card"

export const runtime = "nodejs"

/**
 * GET /u/[id]/card?f=square|story|wide
 * Image PNG partageable/téléchargeable (l'image devient le message).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fRaw = req.nextUrl.searchParams.get("f")
  const format: CardFormat = fRaw === "square" || fRaw === "story" || fRaw === "wide" ? fRaw : "square"

  const p = await getPublicProfile(id)
  const { element, width, height } = buildCard(p, format)

  return new ImageResponse(element, {
    width,
    height,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
  })
}
