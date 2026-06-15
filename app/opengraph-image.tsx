import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const alt = "TradeLeague — One trade a week. Real rivals."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const C = {
  bgFrom: "#0f1424", bgTo: "#1a2236", text: "#e9ecf1",
  muted: "#9aa3b5", gold: "#d4af5a", goldText: "#12182b",
}

// Image d'aperçu de lien (Reddit / X / WhatsApp…) pour la page d'accueil.
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: `linear-gradient(135deg, ${C.bgFrom} 0%, ${C.bgTo} 100%)`, color: C.text, padding: 80, fontFamily: "sans-serif" }}>
        {/* Marque */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", width: 64, height: 64, borderRadius: 16, background: C.gold, alignItems: "center", justifyContent: "center", fontSize: 40 }}>📈</div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>TradeLeague</div>
        </div>

        {/* Accroche */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>One trade a week.</div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>
            <span>Real stocks. </span>
            <span style={{ color: C.gold, marginLeft: 18 }}>Real rivals.</span>
          </div>
          <div style={{ display: "flex", fontSize: 34, color: C.muted, marginTop: 16 }}>Build your portfolio. Beat the index. Climb the leaderboard.</div>
        </div>

        {/* Pied : badge + disclaimer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", background: C.gold, color: C.goldText, fontSize: 28, fontWeight: 800, padding: "10px 26px", borderRadius: 999 }}>Free beta</div>
          <div style={{ display: "flex", fontSize: 24, color: C.muted }}>Fantasy trading game · not investment advice</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
