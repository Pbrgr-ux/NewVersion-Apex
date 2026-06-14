"use client"

import Link from "next/link"
import { Activity, Users } from "lucide-react"
import type { PulseData } from "@/lib/pulse-data"

export function PulseScreen({ data }: { data: PulseData }) {
  const { totalPlayers, rows } = data
  const maxPct = rows.length > 0 ? Math.max(...rows.map((r) => r.holdersPct), 1) : 1

  return (
    <main className="flex min-h-svh flex-col bg-background px-4 pt-2 pb-24">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="h-5 w-5 text-primary" />
        <h1 className="text-[15px] font-bold tracking-tight text-foreground uppercase">Pulse</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Where the league is positioned this week — are you with the crowd or against it?</p>

      {totalPlayers === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Activity className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground max-w-[240px]">No positions yet this week. The Pulse fills up once players submit their portfolios.</p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span><span className="font-semibold text-foreground">{totalPlayers}</span> player{totalPlayers > 1 ? "s" : ""} positioned · {rows.length} stock{rows.length > 1 ? "s" : ""} held</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {rows.map((r) => (
              <Link key={r.ticker} href={`/stock/${encodeURIComponent(r.ticker)}`}
                className="rounded-xl border border-border bg-card px-2.5 py-2.5 transition-colors hover:border-primary/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold text-foreground">
                    {r.ticker.replace(".", "").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{r.ticker}</span>
                      <span className="text-sm font-bold tabular-nums text-foreground">{r.holdersPct}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs text-muted-foreground">{r.name}</span>
                      <span className="text-xs text-muted-foreground">avg {r.avgAllocation}%</span>
                    </div>
                    {/* Barre de popularité (relative au plus détenu) */}
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(r.holdersPct / maxPct) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
            Anonymous, aggregated positioning — individual portfolios stay private.
          </p>
        </>
      )}
    </main>
  )
}
