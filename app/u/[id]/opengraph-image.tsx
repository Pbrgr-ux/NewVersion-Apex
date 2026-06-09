import { ImageResponse } from "next/og"
import { getPublicProfile } from "@/lib/public-profile"

export const runtime = "nodejs"
export const alt = "TradeLeague player card"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

function fmtPerf(v: number | null): string {
  if (v == null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getPublicProfile(id)

  const pseudo  = p?.pseudo ?? "Trader"
  const rank    = p?.rang ? `#${p.rang}` : "—"
  const perf    = fmtPerf(p?.seasonPerf ?? null)
  const perfPos = (p?.seasonPerf ?? 0) >= 0
  const season  = p?.seasonNom ?? "TradeLeague"
  const initials = pseudo.slice(0, 2).toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: "linear-gradient(135deg, #0f1424 0%, #1a2236 100%)",
          color: "#e9ecf1", padding: 64, fontFamily: "sans-serif",
        }}
      >
        {/* En-tête marque */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", width: 48, height: 48, borderRadius: 12, background: "#d4af5a", alignItems: "center", justifyContent: "center", fontSize: 30 }}>📈</div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>TradeLeague</div>
        </div>

        {/* Corps */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 48 }}>
          {/* Avatar (initiales) */}
          <div style={{ display: "flex", width: 200, height: 200, borderRadius: 100, background: "#26304a", border: "4px solid #d4af5a", alignItems: "center", justifyContent: "center", fontSize: 84, fontWeight: 700 }}>
            {initials}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 56, fontWeight: 800 }}>{pseudo}</div>
            <div style={{ fontSize: 28, color: "#9aa3b5" }}>{season}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 16 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1 }}>{rank}</div>
                <div style={{ fontSize: 24, color: "#9aa3b5" }}>Rank</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, color: perfPos ? "#3ddc84" : "#ff6b6b" }}>{perf}</div>
                <div style={{ fontSize: 24, color: "#9aa3b5" }}>This season</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied */}
        <div style={{ display: "flex", fontSize: 26, color: "#9aa3b5" }}>
          One trade a week. Real rivals. · tradeleague
        </div>
      </div>
    ),
    { ...size }
  )
}
