import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { TrendingUp, Crown } from "lucide-react"
import { getPublicProfile } from "@/lib/public-profile"
import { resolvePreset, isImageUrl } from "@/lib/avatars"
import { ShareButton } from "@/components/share-button"

export const dynamic = "force-dynamic"

function fmtPerf(v: number | null): string {
  if (v == null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
}
function avatarSrc(a: string | null): string | null {
  const p = resolvePreset(a); if (p) return p.src
  return isImageUrl(a) ? a : null
}

export async function generateMetadata(
  { params, searchParams }: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  },
): Promise<Metadata> {
  const { id } = await params
  const sp = await searchParams
  const kind = sp?.card === "ranking" ? "ranking" : "hero"

  const p = await getPublicProfile(id)
  if (!p) return { title: "TradeLeague" }
  const rank = p.rang ? `#${p.rang}` : ""
  const title = `${p.pseudo} ${rank} on TradeLeague`.trim()
  const description = p.seasonPerf != null
    ? `${fmtPerf(p.seasonPerf)} this season · ${p.seasonNom}`
    : `Playing ${p.seasonNom} on TradeLeague`

  // Image OG = carte serveur (hero ou ranking) → incluse dans le message sur TOUS les navigateurs
  const h = await headers()
  const host  = h.get("host") ?? ""
  const proto = h.get("x-forwarded-proto") ?? "https"
  const image = `${proto}://${host}/u/${id}/card?f=wide&card=${kind}`

  return {
    title,
    description,
    openGraph: { title, description, type: "profile", images: [{ url: image, width: 1200, height: 630 }] },
    twitter:   { card: "summary_large_image", title, description, images: [image] },
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getPublicProfile(id)
  if (!p) notFound()

  const h = await headers()
  const host  = h.get("host") ?? ""
  const proto = h.get("x-forwarded-proto") ?? "https"
  const shareUrl  = `${proto}://${host}/u/${p.userId}`
  const shareText = p.topPct
    ? `Top ${p.topPct}% on TradeLeague (#${p.rang}) 🚀 Can you beat me?`
    : p.rang
      ? `I'm #${p.rang} on TradeLeague 🚀`
      : `Check out my TradeLeague profile 🚀`

  const src = avatarSrc(p.avatar)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <TrendingUp className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">TradeLeague</span>
      </Link>

      {/* Carte profil */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-primary">
          {src ? (
            <img src={src} alt={p.pseudo} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary text-2xl font-bold text-foreground">
              {p.pseudo.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="mb-1 flex items-center justify-center gap-2">
          <h1 className="text-xl font-bold text-foreground">{p.pseudo}</h1>
          {p.isPro && <Crown className="h-4 w-4 text-primary" />}
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{p.seasonNom}</p>
        {p.topPct && (
          <div className="mb-4 inline-flex rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            Top {p.topPct}%
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-secondary/50 py-3">
            <p className="text-lg font-bold text-foreground">{p.rang ? `#${p.rang}` : "—"}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rank</p>
          </div>
          <div className="rounded-lg bg-secondary/50 py-3">
            <p className={`text-lg font-bold tabular-nums ${p.seasonPerf == null ? "text-muted-foreground" : p.seasonPerf >= 0 ? "text-green-600" : "text-red-600"}`}>
              {fmtPerf(p.seasonPerf)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Season</p>
          </div>
          <div className="rounded-lg bg-secondary/50 py-3">
            <p className={`text-lg font-bold tabular-nums ${p.allTimePerf == null ? "text-muted-foreground" : p.allTimePerf >= 0 ? "text-green-600" : "text-red-600"}`}>
              {fmtPerf(p.allTimePerf)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">All-time</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <ShareButton url={shareUrl} cardBase={`${proto}://${host}/u/${p.userId}/card`} text={shareText} label="Share" />
          <Link href="/signup" className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Join TradeLeague →
          </Link>
        </div>
      </div>

      <p className="mt-6 max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground">
        TradeLeague is a fantasy trading game for entertainment only — not investment advice.
      </p>
    </main>
  )
}
