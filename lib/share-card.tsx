/* eslint-disable @next/next/no-img-element */
/**
 * lib/share-card.tsx
 *
 * Rendu des cartes de partage (next/og), réutilisé par :
 *  - app/u/[id]/opengraph-image.tsx  (aperçu de lien, format "wide")
 *  - app/u/[id]/card/route.ts        (image partageable, tous formats + variantes)
 *
 * Variantes contextuelles (le « héros » de la carte change selon le moment) :
 *  - "auto"    : choisit le meilleur angle (podium si top-3, sinon semaine)
 *  - "week"    : résultat de la semaine + mini-graphe
 *  - "podium"  : médaille géante (top-3)
 *  - "alltime" : performance cumulée all-time
 *  - "rankup"  : montée de rang (nécessite `fromRank`)
 *
 * Pas de fetch / pas d'import serveur ici → reçoit les données prêtes.
 */

import type { PublicProfile } from "@/lib/public-profile"

export type CardFormat  = "wide" | "square" | "story"
export type CardVariant = "auto" | "week" | "podium" | "alltime" | "rankup"
export type CardKind    = "hero" | "ranking"

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

function resolveVariant(p: PublicProfile | null, v: CardVariant): CardVariant {
  if (v !== "auto") return v
  if (p?.rang && p.rang <= 3) return "podium"
  if (p?.weekPerf != null) return "week"
  return "alltime"
}

export function buildCard(
  p: PublicProfile | null,
  format: CardFormat,
  variant: CardVariant = "auto",
  fromRank?: number | null,
  kind: CardKind = "hero",
) {
  const size = SIZES[format]
  const pseudo   = p?.pseudo ?? "Trader"
  const initials = pseudo.slice(0, 2).toUpperCase()
  const season   = p?.seasonNom ?? "TradeLeague"
  const medal    = p?.rang === 1 ? "🥇" : p?.rang === 2 ? "🥈" : p?.rang === 3 ? "🥉" : "🏅"
  const topPct   = p?.topPct ? `Top ${p.topPct}%` : null
  const spark    = p?.weekSpark ?? []
  const vertical = format !== "wide"
  const v        = resolveVariant(p, variant)

  const s = vertical
    ? { avatar: 220, pseudo: 60, season: 30, big: 120, lbl: 28, pad: 80 }
    : { avatar: 200, pseudo: 54, season: 26, big: 80,  lbl: 22, pad: 64 }

  // Bannière contextuelle (au-dessus du pseudo)
  let banner: string | null = null
  if (v === "podium")  banner = p?.rang === 1 ? "🏆 LEAGUE LEADER" : "🏅 PODIUM FINISH"
  else if (v === "rankup" && fromRank && p?.rang && fromRank > p.rang) banner = `▲ UP ${fromRank - p.rang} SPOTS`
  else if (v === "alltime") banner = "📈 ALL-TIME RETURN"

  // Cellules « héros » du milieu
  function cell(big: string, label: string, color?: string) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: s.big, fontWeight: 800, lineHeight: 1, color: color ?? C.text }}>{big}</div>
        <div style={{ fontSize: s.lbl, color: C.muted }}>{label}</div>
      </div>
    )
  }

  const weekPos = (p?.weekPerf ?? p?.seasonPerf ?? 0) >= 0
  const sparkEl = spark.length >= 2 ? (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: s.big, marginLeft: 8 }}>
      {spark.map((val, i) => (
        <div key={i} style={{ display: "flex", width: 16, height: `${Math.round(18 + val * (s.big - 22))}px`, borderRadius: 4, background: weekPos ? C.up : C.down, opacity: 0.55 + 0.45 * (i / (spark.length - 1)) }} />
      ))}
    </div>
  ) : null

  let hero: React.ReactNode
  if (v === "podium") {
    hero = (
      <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
        <div style={{ display: "flex", fontSize: s.big * 1.5, lineHeight: 1 }}>{medal}</div>
        {cell(p?.rang ? `#${p.rang}` : "—", "Rank")}
        {cell(fmtPerf(p?.seasonPerf ?? null), "This season", (p?.seasonPerf ?? 0) >= 0 ? C.up : C.down)}
      </div>
    )
  } else if (v === "alltime") {
    hero = (
      <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
        {cell(fmtPerf(p?.allTimePerf ?? null), "All-time", (p?.allTimePerf ?? 0) >= 0 ? C.up : C.down)}
        {cell(p?.rang ? `#${p.rang}` : "—", "Current rank")}
      </div>
    )
  } else if (v === "rankup") {
    hero = (
      <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
        {cell(`#${p?.rang ?? "—"}`, "Now", C.up)}
        {cell(fmtPerf(p?.weekPerf ?? p?.seasonPerf ?? null), "This week", weekPos ? C.up : C.down)}
        {sparkEl}
      </div>
    )
  } else {
    // week (défaut)
    hero = (
      <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
        {cell(p?.rang ? `#${p.rang}` : "—", "Rank")}
        {cell(fmtPerf(p?.weekPerf ?? p?.seasonPerf ?? null), p?.weekPerf != null ? "This week" : "This season", weekPos ? C.up : C.down)}
        {sparkEl}
      </div>
    )
  }

  const Brand = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", width: 48, height: 48, borderRadius: 12, background: C.gold, alignItems: "center", justifyContent: "center", fontSize: 30 }}>📈</div>
        <div style={{ fontSize: 34, fontWeight: 700 }}>TradeLeague</div>
      </div>
      {topPct && <div style={{ display: "flex", background: C.gold, color: C.goldText, fontSize: 30, fontWeight: 800, padding: "8px 22px", borderRadius: 999 }}>{topPct}</div>}
    </div>
  )

  const Avatar = (
    <div style={{ display: "flex", width: s.avatar, height: s.avatar, borderRadius: s.avatar / 2, background: C.ring, border: `4px solid ${C.gold}`, alignItems: "center", justifyContent: "center", fontSize: s.avatar * 0.42, fontWeight: 700 }}>{initials}</div>
  )

  const Identity = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: vertical ? "center" : "flex-start" }}>
      {banner && <div style={{ display: "flex", fontSize: s.lbl + 4, fontWeight: 800, color: C.gold, letterSpacing: 1 }}>{banner}</div>}
      <div style={{ fontSize: s.pseudo, fontWeight: 800 }}>{pseudo}</div>
      <div style={{ fontSize: s.season, color: C.muted }}>{season}</div>
      <div style={{ display: "flex", marginTop: 14 }}>{hero}</div>
    </div>
  )

  const Footer = (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 26, color: C.muted }}>
      <div style={{ display: "flex" }}>One trade a week. Real glory.</div>
      <div style={{ display: "flex", color: C.gold, fontWeight: 700 }}>Can you beat me? →</div>
    </div>
  )

  // ── Variante CLASSEMENT (top 3 + soi) ───────────────────────
  if (kind === "ranking" && p?.leaderboard && p.leaderboard.length > 0) {
    const rf = vertical ? 46 : 40
    const rows = p.leaderboard.map((r, i) => (
      <div key={i} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
        padding: vertical ? "22px 30px" : "16px 28px", borderRadius: 20,
        background: r.isSelf ? "rgba(212,175,90,0.16)" : "rgba(255,255,255,0.05)",
        border: `2px solid ${r.isSelf ? C.gold : "transparent"}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{
            display: "flex", width: rf + 18, height: rf + 18, borderRadius: 999,
            alignItems: "center", justifyContent: "center", fontSize: rf * 0.62, fontWeight: 800,
            background: r.rang === 1 ? "#d4af5a" : r.rang === 2 ? "#c7ccd6" : r.rang === 3 ? "#cd7f4d" : C.ring,
            color: r.rang <= 3 ? C.goldText : C.muted,
          }}>{r.rang}</div>
          <div style={{ display: "flex", fontSize: rf, fontWeight: 700, color: r.isSelf ? C.gold : C.text }}>
            {r.isSelf ? `${r.pseudo} (You)` : r.pseudo}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: rf, fontWeight: 800, color: (r.seasonPerf ?? 0) >= 0 ? C.up : C.down }}>
          {fmtPerf(r.seasonPerf)}
        </div>
      </div>
    ))
    const rankingEl = (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: `linear-gradient(135deg, ${C.bgFrom} 0%, ${C.bgTo} 100%)`, color: C.text, padding: s.pad, fontFamily: "sans-serif" }}>
        {Brand}
        <div style={{ display: "flex", flexDirection: "column", gap: vertical ? 22 : 16, width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", fontSize: s.lbl + 8, fontWeight: 800, color: C.gold, letterSpacing: 2 }}>RANKING</div>
            <div style={{ display: "flex", fontSize: s.season, color: C.muted }}>{season}</div>
          </div>
          {rows}
        </div>
        {Footer}
      </div>
    )
    return { element: rankingEl, ...size }
  }

  const element = (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: vertical ? "center" : "stretch", background: `linear-gradient(135deg, ${C.bgFrom} 0%, ${C.bgTo} 100%)`, color: C.text, padding: s.pad, fontFamily: "sans-serif" }}>
      {Brand}
      {vertical ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>{Avatar}{Identity}</div>
      ) : (
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 48 }}>{Avatar}{Identity}</div>
      )}
      {Footer}
    </div>
  )

  return { element, ...size }
}
