import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { getPublicProfile } from "@/lib/public-profile"
import { buildCard, type CardFormat, type CardVariant, type CardKind } from "@/lib/share-card"

export const runtime = "nodejs"

const VARIANTS: CardVariant[] = ["auto", "week", "podium", "alltime", "rankup"]

/**
 * GET /u/[id]/card?f=square|story|wide&v=auto|week|podium|alltime|rankup&from=N&card=hero|ranking
 * Image PNG partageable/téléchargeable (l'image devient le message).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sp = req.nextUrl.searchParams
  const fRaw = sp.get("f")
  const format: CardFormat = fRaw === "square" || fRaw === "story" || fRaw === "wide" ? fRaw : "square"
  const vRaw = sp.get("v") as CardVariant | null
  const variant: CardVariant = vRaw && VARIANTS.includes(vRaw) ? vRaw : "auto"
  const fromRank = sp.get("from") ? parseInt(sp.get("from")!, 10) : null
  const kind: CardKind = sp.get("card") === "ranking" ? "ranking" : "hero"

  const p = await getPublicProfile(id)
  const { element, width, height } = buildCard(p, format, variant, fromRank, kind)

  return new ImageResponse(element, {
    width,
    height,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
  })
}
