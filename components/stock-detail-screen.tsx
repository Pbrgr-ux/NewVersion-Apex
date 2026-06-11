"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import type { StockDetail } from "@/lib/stock-detail"

// ── Helpers ───────────────────────────────────────────────────
function fmtNum(v: number | null, digits = 2): string {
  if (v == null) return "—"
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function fmtCompact(v: number | null): string {
  if (v == null) return "—"
  if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(2)}T`
  if (Math.abs(v) >= 1e9)  return `${(v / 1e9).toFixed(2)}B`
  if (Math.abs(v) >= 1e6)  return `${(v / 1e6).toFixed(2)}M`
  if (Math.abs(v) >= 1e3)  return `${(v / 1e3).toFixed(2)}K`
  return `${v}`
}

function fmtPct(v: number | null): string {
  if (v == null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
}

// ── Graphique 6 mois (SVG) ────────────────────────────────────
function PriceChart({ data, positive }: { data: { date: string; close: number; ma200?: number | null }[]; positive: boolean }) {
  if (data.length < 2) {
    return <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No chart data</div>
  }

  const W = 320, H = 180, PAD = 4
  const closes = data.map((d) => d.close)
  const maVals = data.map((d) => d.ma200).filter((v): v is number => v != null)
  const hasMa  = maVals.length > 1
  const MA_COLOR = "#d4af5a"
  // Échelle incluant la MA200 pour que les deux courbes tiennent dans le cadre
  const min = Math.min(...closes, ...maVals)
  const max = Math.max(...closes, ...maVals)
  const range = max - min || 1
  const color = positive ? "#22c55e" : "#ef4444"

  const yFor = (price: number) => PAD + (1 - (price - min) / range) * (H - 2 * PAD)
  const xFor = (i: number) => PAD + (i / (data.length - 1)) * (W - 2 * PAD)

  const pts = data.map((d, i) => `${xFor(i).toFixed(1)},${yFor(d.close).toFixed(1)}`)
  const line = pts.join(" ")
  const area = `${PAD},${H - PAD} ${line} ${W - PAD},${H - PAD}`

  // Polyline MA200 (sur les points où elle est définie)
  const maLine = hasMa
    ? data.map((d, i) => (d.ma200 != null ? `${xFor(i).toFixed(1)},${yFor(d.ma200).toFixed(1)}` : null))
        .filter(Boolean).join(" ")
    : ""

  // Repères de dates (premier, milieu, dernier)
  const ticks = [0, Math.floor(data.length / 2), data.length - 1]

  // Lignes de repère horizontales (2 niveaux à 1/3 et 2/3 de l'amplitude)
  const fmtLvl = (v: number) => v >= 100 ? v.toFixed(0) : v.toFixed(2)
  const levels = [min + range * (2 / 3), min + range * (1 / 3)].map((price) => ({
    price,
    topPct: (yFor(price) / H) * 100,
  }))

  return (
    <div className="w-full">
      <div className="relative" style={{ height: 180 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Lignes de repère pointillées */}
          {levels.map((lvl, i) => (
            <line key={i}
              x1={PAD} x2={W - PAD} y1={yFor(lvl.price)} y2={yFor(lvl.price)}
              stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3"
              className="text-muted-foreground/40" vectorEffect="non-scaling-stroke" />
          ))}
          <polygon points={area} fill="url(#stockGrad)" />
          <polyline points={line} fill="none" stroke={color} strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {/* Moyenne mobile 200 jours */}
          {hasMa && (
            <polyline points={maLine} fill="none" stroke={MA_COLOR} strokeWidth="1.2"
              strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
        {/* Labels des niveaux (HTML, non déformés) */}
        {levels.map((lvl, i) => (
          <span key={i}
            className="absolute right-0 -translate-y-1/2 bg-card/80 px-1 text-[10px] tabular-nums text-muted-foreground"
            style={{ top: `${lvl.topPct}%` }}>
            {fmtLvl(lvl.price)}
          </span>
        ))}
      </div>
      <div className="flex justify-between px-1 mt-1 text-[10px] text-muted-foreground">
        {ticks.map((i) => (
          <span key={i}>
            {new Date(data[i].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ))}
      </div>
      {/* Légende */}
      <div className="mt-2 flex items-center gap-4 px-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: color }} /> Price
        </span>
        {hasMa && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-4 border-t border-dashed" style={{ borderColor: MA_COLOR }} /> MA 200d
          </span>
        )}
      </div>
    </div>
  )
}

// ── Composant ─────────────────────────────────────────────────
export function StockDetailScreen({ detail }: { detail: StockDetail }) {
  const router = useRouter()
  const { stats, history } = detail

  const first    = history[0]?.close
  const last     = history[history.length - 1]?.close
  const positive = (stats.dayChangePct ?? (last && first ? last - first : 0)) >= 0
  const cur      = stats.currency === "USD" ? "$" : stats.currency === "EUR" ? "€" : (stats.currency ?? "")

  const RATIOS: { label: string; value: string }[] = [
    { label: "Market cap",    value: stats.marketCap != null ? `${fmtCompact(stats.marketCap)} ${cur}` : "—" },
    { label: "P/E (TTM)",     value: fmtNum(stats.trailingPE, 1) },
    { label: "Dividend yield",value: stats.dividendYield != null ? `${stats.dividendYield.toFixed(2)}%` : "—" },
    { label: "52w high",      value: stats.fiftyTwoHigh != null ? `${fmtNum(stats.fiftyTwoHigh)} ${cur}` : "—" },
    { label: "52w low",       value: stats.fiftyTwoLow  != null ? `${fmtNum(stats.fiftyTwoLow)} ${cur}`  : "—" },
    { label: "Volume",        value: fmtCompact(stats.volume) },
  ]

  return (
    <main className="flex min-h-svh flex-col bg-background px-4 pt-2 pb-24">

      {/* Header */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Titre + prix */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{detail.ticker}</h1>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            {detail.region}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{detail.name}</p>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {fmtNum(stats.price)} <span className="text-base font-normal text-muted-foreground">{cur}</span>
          </span>
          <span className={`text-sm font-bold tabular-nums ${positive ? "text-green-500" : "text-red-500"}`}>
            {fmtPct(stats.dayChangePct)}
          </span>
        </div>
      </div>

      {/* Graphique 6 mois */}
      <div className="rounded-xl border border-border bg-card p-3 mb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          6-month price
        </p>
        <PriceChart data={history} positive={positive} />
      </div>

      {/* Positionnement de la foule (Pulse) */}
      {detail.crowd && detail.crowd.holdersPct > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">League positioning</span>
            <span className="text-xs text-muted-foreground">{detail.crowd.totalPlayers} player{detail.crowd.totalPlayers > 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-2xl font-bold tabular-nums text-foreground">{detail.crowd.holdersPct}%</span>
              <span className="ml-1.5 text-xs text-muted-foreground">hold it</span>
            </div>
            <div>
              <span className="text-2xl font-bold tabular-nums text-foreground">{detail.crowd.avgAllocation}%</span>
              <span className="ml-1.5 text-xs text-muted-foreground">avg allocation</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${detail.crowd.holdersPct}%` }} />
          </div>
        </div>
      )}

      {/* Ratios clés */}
      <div className="grid grid-cols-2 gap-2">
        {RATIOS.map((r) => (
          <div key={r.label} className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-xs text-muted-foreground">{r.label}</p>
            <p className="text-sm font-bold tabular-nums text-foreground">{r.value}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
