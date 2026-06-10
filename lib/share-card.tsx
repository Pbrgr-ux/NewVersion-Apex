/* eslint-disable @next/next/no-img-element */
/**
 * lib/share-card.tsx
 *
 * Rendu de la carte de partage (next/og), réutilisé par :
 *  - app/u/[id]/opengraph-image.tsx  (aperçu de lien, format "wide")
 *  - app/u/[id]/card/route.ts        (image téléchargeable/partageable, tous formats)
 *
 * Pas de fetch / pas d'import serveur ici → reçoit les données prêtes.
 */

import type { PublicProfile } from "@/lib/public-profile"

export type CardFormat = "wide" | "square" | "story"

const SIZES: Record<CardFormat, { width: number; height: number }> = {
  wide:   { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  story:  { width: 1080, height: 1920 },
}

function fmtPerf(v: number | null): string {
  if (v == null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
}

const C = {
  bgFrom: "#0f1424", bgTo: "#1a2236", text: "#e9ecf1", muted: "#9aa3b5",
  gold: "#d4af5a", goldText: "#12182b", up: "#3ddc84", down: "#ff6b6b", ring: "#26304a",
}

export function buildCard(p: PublicProfile | null, format: CardFormat) {
  const size = SIZES[format]
  const pseudo   = p?.pseudo ?? "Trader"
  const initials = pseudo.slice(0, 2).toUpperCase()
  const season   = p?.seasonNom ?? "TradeLeague"
  const medal    = p?.rang === 1 ? "🥇" : p?.rang === 2 ? "🥈" : p?.rang === 3 ? "🥉" : null
  const rankText = medal ?? (p?.rang ? `#${p.rang}` : "—")
  const headVal  = p?.weekPerf ?? p?.seasonPerf ?? null
  const headLbl  = p?.weekPerf != null ? "This week" : "This season"
  const pos      = (headVal ?? 0) >= 0
  const topPct   = p?.topPct ? `Top ${p.topPct}%` : null
  const spark    = p?.weekSpark ?? []
  const vertical = format !== "wide"

  // Échelles selon le format
  const s = vertical
    ? { avatar: 220, pseudo: 60, season: 30, big: 120, lbl: 28, pad: 80, gap: 18 }
    : { avatar: 200, pseudo: 54, season: 26, big: 80,  lbl: 22, pad: 64, gap: 6 }

  const Brand = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", width: 48, height: 48, borderRadius: 12, background: C.gold, alignItems: "center", justifyContent: "center", fontSize: 30 }}>📈</div>
        <div style={{ fontSize: 34, fontWeight: 700 }}>TradeLeague</div>
      </div>
      {topPct && (
        <div style={{ display: "flex", background: C.gold, color: C.goldText, fontSize: 30, fontWeight: 800, padding: "8px 22px", borderRadius: 999 }}>{topPct}</div>
      )}
    </div>
  )

  const Avatar = (
    <div style={{ display: "flex", width: s.avatar, height: s.avatar, borderRadius: s.avatar / 2, background: C.ring, border: `4px solid ${C.gold}`, alignItems: "center", justifyContent: "center", fontSize: s.avatar * 0.42, fontWeight: 700 }}>{initials}</div>
  )

  const Stats = (
    <div style={{ display: "flex", flexDirection: "column", gap: s.gap, alignItems: vertical ? "center" : "flex-start" }}>
      <div style={{ fontSize: s.pseudo, fontWeight: 800 }}>{pseudo}</div>
      <div style={{ fontSize: s.season, color: C.muted }}>{season}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 28, marginTop: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: s.big, fontWeight: 800, lineHeight: 1 }}>{rankText}</div>
          <div style={{ fontSize: s.lbl, color: C.muted }}>Rank</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: s.big, fontWeight: 800, lineHeight: 1, color: pos ? C.up : C.down }}>{fmtPerf(headVal)}</div>
          <div style={{ fontSize: s.lbl, color: C.muted }}>{headLbl}</div>
        </div>
        {spark.length >= 2 && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: s.big, marginLeft: 8 }}>
            {spark.map((v, i) => (
              <div key={i} style={{ display: "flex", width: 16, height: `${Math.round(18 + v * (s.big - 22))}px`, borderRadius: 4, background: pos ? C.up : C.down, opacity: 0.55 + 0.45 * (i / (spark.length - 1)) }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const Footer = (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 26, color: C.muted }}>
      <div style={{ display: "flex" }}>One trade a week. Real rivals.</div>
      <div style={{ display: "flex", color: C.gold, fontWeight: 700 }}>Can you beat me? →</div>
    </div>
  )

  const element = (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: vertical ? "center" : "stretch", background: `linear-gradient(135deg, ${C.bgFrom} 0%, ${C.bgTo} 100%)`, color: C.text, padding: s.pad, fontFamily: "sans-serif" }}>
      {Brand}
      {vertical ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
          {Avatar}
          {Stats}
        </div>
      ) : (
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 48 }}>
          {Avatar}
          {Stats}
        </div>
      )}
      {Footer}
    </div>
  )

  return { element, ...size }
}
