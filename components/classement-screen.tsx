"use client"

import { useState } from "react"
import Link from "next/link"
import { Trophy, Crown } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AllClassementData, LeaderboardEntry } from "@/lib/classement-data"
import { resolvePreset, isImageUrl }    from "@/lib/avatars"

// avatar (champ DB) → URL affichable, ou null
function avatarSrc(avatar: string | null): string | null {
  const p = resolvePreset(avatar)
  if (p) return p.src
  if (isImageUrl(avatar)) return avatar
  return null
}

// ── Types ─────────────────────────────────────────────────────
type TabId = "confirmed" | "rookie" | "allTime" | "mois" | "semaine" | "jour"

const TABS: { id: TabId; label: string }[] = [
  { id: "confirmed", label: "Overall"  },
  { id: "rookie",    label: "Rookie"   },
  { id: "allTime",   label: "All-Time" },
  { id: "mois",      label: "Month"    },
  { id: "semaine",   label: "Week"     },
  { id: "jour",      label: "Day"      },
]

// ── Helpers ───────────────────────────────────────────────────
function fmtPerf(v: number | null): string {
  if (v == null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
}

// ── Empty state ───────────────────────────────────────────────
function EmptyTab({ tab }: { tab: TabId }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Trophy className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground max-w-[240px]">
        {tab === "confirmed"
          ? "No ranked player yet."
          : "Not enough price data yet to compute this ranking."}
      </p>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────
export function ClassementScreen({ data }: { data: AllClassementData }) {
  const [activeTab, setActiveTab] = useState<TabId>("confirmed")

  const lists: Record<TabId, LeaderboardEntry[]> = {
    confirmed: data.confirmed,
    rookie:    data.rookie,
    allTime:   data.allTime,
    mois:      data.mois,
    semaine:   data.semaine,
    jour:      data.jour,
  }

  const entries   = lists[activeTab]
  const currentId = data.currentUserId
  const selfEntry = entries.find((e) => e.user_id === currentId)

  const { cac40_variation, sp500_variation } = data.indices

  function fmtPerfColor(v: number | null) {
    if (v == null) return "text-muted-foreground"
    return v >= 0 ? "text-green-500" : "text-red-500"
  }

  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-bold text-foreground">Ranking</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.currentSaisonNom}
          {entries.length > 0 && ` · ${entries.length} player${entries.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* ── Indices marché ──────────────────────────────────── */}
      {(cac40_variation !== null || sp500_variation !== null) && (
        <div className="mx-4 mb-2 flex gap-2">
          {cac40_variation !== null && (
            <div className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-secondary/60 px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground">CAC 40</span>
              <span className={`text-xs font-bold tabular-nums ${fmtPerfColor(cac40_variation)}`}>
                {fmtPerf(cac40_variation)}
              </span>
            </div>
          )}
          {sp500_variation !== null && (
            <div className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-secondary/60 px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground">S&P 500</span>
              <span className={`text-xs font-bold tabular-nums ${fmtPerfColor(sp500_variation)}`}>
                {fmtPerf(sp500_variation)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="px-4 pb-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
          <TabsList className="w-full">
            {TABS.map(({ id, label }) => (
              <TabsTrigger key={id} value={id} className="flex-1 text-xs sm:text-sm">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* ── Contenu principal ───────────────────────────────── */}
      <div className="flex-1 px-4 pb-4">
        {entries.length === 0 ? (
          <EmptyTab tab={activeTab} />
        ) : (
          <>
            {/* ── Votre position ───────────────────────────────── */}
            {selfEntry && (
              <div className="mb-3 flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
                <span className="text-sm font-medium text-primary">Your position</span>
                <span className="font-bold text-primary tabular-nums">
                  #{selfEntry.rang}
                  <span className="ml-2 font-normal text-primary/70">{fmtPerf(selfEntry.perf)}</span>
                </span>
              </div>
            )}

            {/* ── Classement — même forme que les Floors ───────── */}
            <div className="rounded-xl border border-border bg-card px-2.5 py-3">
              <div className="flex flex-col gap-1.5">
                {entries.map((m) => {
                  const medal = m.rang === 1 ? "bg-amber-400 text-black" : m.rang === 2 ? "bg-slate-300 text-black" : m.rang === 3 ? "bg-orange-500 text-white" : "bg-secondary text-muted-foreground"
                  const src = avatarSrc(m.avatar)
                  const isSelf = m.user_id === currentId
                  return (
                    <div key={m.user_id} className={`flex w-full items-center gap-2.5 px-2 py-1 ${isSelf ? "rounded-[4px] bg-green-600/10" : ""}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${medal}`}>{m.rang}</span>
                      {src ? (
                        <img src={src} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">{m.pseudo.charAt(0).toUpperCase()}</span>
                      )}
                      <span className={`flex-1 min-w-0 truncate text-sm text-foreground ${isSelf ? "font-bold" : "font-medium"}`}>
                        {m.pseudo}{isSelf && <span className="ml-1 text-xs font-normal opacity-60">(you)</span>}
                        {m.is_pro && <Crown className="ml-1 inline h-3 w-3 text-primary" />}
                      </span>
                      <span className={`text-sm font-bold tabular-nums ${m.perf == null ? "text-muted-foreground" : m.perf >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtPerf(m.perf)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
