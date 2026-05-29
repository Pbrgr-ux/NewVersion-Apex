"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Trophy, TrendingUp, TrendingDown,
  Home, BarChart3, User, Crown, Medal,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback }      from "@/components/ui/avatar"
import { Badge }                        from "@/components/ui/badge"
import type { AllClassementData, LeaderboardEntry } from "@/lib/classement-data"

// ── Types ─────────────────────────────────────────────────────
type TabId = "saison" | "mois" | "semaine" | "jour"

const TABS: { id: TabId; label: string }[] = [
  { id: "saison",  label: "Saison"  },
  { id: "mois",    label: "Mois"    },
  { id: "semaine", label: "Semaine" },
  { id: "jour",    label: "Jour"    },
]

// ── Helpers ───────────────────────────────────────────────────
function fmtPerf(v: number | null): string {
  if (v == null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
}

function podiumRingClass(rank: 1 | 2 | 3): string {
  return rank === 1 ? "ring-2 ring-amber-400"
    : rank === 2   ? "ring-2 ring-slate-400"
                   : "ring-2 ring-orange-500"
}

function podiumFallbackClass(rank: 1 | 2 | 3): string {
  return rank === 1 ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white font-bold"
    : rank === 2   ? "bg-gradient-to-br from-slate-400 to-gray-500 text-white font-bold"
                   : "bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold"
}

function badgeBg(rank: 1 | 2 | 3): string {
  return rank === 1 ? "bg-amber-400" : rank === 2 ? "bg-slate-400" : "bg-orange-500"
}

// ── Podium top 3 ──────────────────────────────────────────────
function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const first  = entries[0]
  const second = entries[1]
  const third  = entries[2]
  if (!first) return null

  function Slot({
    entry,
    rank,
    size = "normal",
  }: {
    entry?: LeaderboardEntry
    rank: 1 | 2 | 3
    size?: "normal" | "large"
  }) {
    if (!entry) return <div className={size === "large" ? "h-16 w-16" : "h-14 w-14"} />
    const positive = (entry.perf ?? 0) >= 0
    return (
      <>
        {rank === 1 && <Crown className="h-6 w-6 text-amber-400 mb-0" />}
        <div className="relative">
          <Avatar className={`${size === "large" ? "h-16 w-16" : "h-14 w-14"} ${podiumRingClass(rank)}`}>
            <AvatarFallback className={`${podiumFallbackClass(rank)} ${size === "large" ? "text-lg" : ""}`}>
              {entry.pseudo.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 flex ${size === "large" ? "h-6 w-6 text-xs" : "h-5 w-5 text-[10px]"} items-center justify-center rounded-full font-bold text-white ${badgeBg(rank)}`}>
            {rank}
          </div>
        </div>
        <span className={`${size === "large" ? "text-sm font-semibold" : "text-xs font-medium"} text-foreground truncate max-w-full px-1 text-center`}>
          {entry.pseudo}
        </span>
        <span className={`${size === "large" ? "text-base" : "text-sm"} font-bold tabular-nums ${positive ? "text-success" : "text-danger"}`}>
          {fmtPerf(entry.perf)}
        </span>
      </>
    )
  }

  return (
    <div className="mb-4 grid grid-cols-3 gap-2">
      {/* 2e — décalé vers le bas */}
      <div className="flex flex-col items-center gap-2 pt-6">
        <Slot entry={second} rank={2} />
      </div>
      {/* 1er — au centre, plus grand */}
      <div className="flex flex-col items-center gap-2">
        <Slot entry={first} rank={1} size="large" />
      </div>
      {/* 3e — décalé vers le bas */}
      <div className="flex flex-col items-center gap-2 pt-6">
        <Slot entry={third} rank={3} />
      </div>
    </div>
  )
}

// ── Ligne de classement ───────────────────────────────────────
function LeaderboardRow({
  entry,
  isSelf,
}: {
  entry:  LeaderboardEntry
  isSelf: boolean
}) {
  const positive = (entry.perf ?? 0) >= 0

  let rowClass = "bg-card border-border"
  if (isSelf)          rowClass = "border-primary/60 bg-primary/10"
  else if (entry.rang === 1) rowClass = "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/40"
  else if (entry.rang === 2) rowClass = "bg-gradient-to-r from-slate-400/10 to-gray-400/10 border-slate-400/40"
  else if (entry.rang === 3) rowClass = "bg-gradient-to-r from-orange-600/10 to-amber-700/10 border-orange-600/40"

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${rowClass}`}>
      {/* Rang / icône */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {entry.rang === 1 ? <Crown  className="h-5 w-5 text-amber-400" />
         : entry.rang === 2 ? <Medal className="h-5 w-5 text-slate-300" />
         : entry.rang === 3 ? <Medal className="h-5 w-5 text-orange-400" />
         : <span className="text-sm font-bold tabular-nums text-muted-foreground">#{entry.rang}</span>}
      </div>

      {/* Avatar */}
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
          {entry.pseudo.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Pseudo + PRO */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className={`truncate font-semibold ${
          isSelf         ? "text-primary"    :
          entry.rang <= 3 ? (entry.rang === 1 ? "text-amber-400" : entry.rang === 2 ? "text-slate-300" : "text-orange-400")
                          : "text-foreground"
        }`}>
          {entry.pseudo}
          {isSelf && <span className="ml-1 text-xs font-normal opacity-60">(vous)</span>}
        </span>
        {entry.is_pro && (
          <Badge variant="secondary" className="shrink-0 bg-primary/20 text-primary text-[10px] px-1.5 py-0 leading-4">
            PRO
          </Badge>
        )}
      </div>

      {/* Perf */}
      <div className="flex shrink-0 items-center gap-1">
        {positive
          ? <TrendingUp   className="h-3.5 w-3.5 text-success" />
          : <TrendingDown className="h-3.5 w-3.5 text-danger"  />}
        <span className={`text-base font-bold tabular-nums ${positive ? "text-success" : "text-danger"}`}>
          {fmtPerf(entry.perf)}
        </span>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────
function EmptyTab({ tab }: { tab: TabId }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Trophy className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground max-w-[240px]">
        {tab === "saison"
          ? "Aucun joueur classé pour l'instant."
          : "Pas encore de données de cours pour calculer ce classement. Lance une synchronisation via /api/sync-cours."}
      </p>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────
export function ClassementScreen({ data }: { data: AllClassementData }) {
  const [activeTab, setActiveTab] = useState<TabId>("saison")

  const lists: Record<TabId, LeaderboardEntry[]> = {
    saison:  data.saison,
    mois:    data.mois,
    semaine: data.semaine,
    jour:    data.jour,
  }

  const entries   = lists[activeTab]
  const top3      = entries.slice(0, 3)
  const rest      = entries.slice(3)
  const currentId = data.currentUserId
  const selfEntry = entries.find((e) => e.user_id === currentId)

  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 px-6 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Classement</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Saison 1
          {entries.length > 0 && ` · ${entries.length} joueur${entries.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* ── Votre position (sticky) ──────────────────────────── */}
      {selfEntry && (
        <div className="mx-4 mb-2 flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
          <span className="text-sm font-medium text-primary">Votre position</span>
          <span className="font-bold text-primary tabular-nums">
            #{selfEntry.rang}
            <span className="ml-2 font-normal text-primary/70">{fmtPerf(selfEntry.perf)}</span>
          </span>
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
            <Podium entries={top3} />
            <div className="flex flex-col gap-2">
              {rest.map((entry) => (
                <LeaderboardRow
                  key={entry.user_id}
                  entry={entry}
                  isSelf={entry.user_id === currentId}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-around py-2">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <Home    className="h-5 w-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>
          <Link href="/classement" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] font-medium">Classement</span>
          </Link>
          <Link href="/profil" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <User  className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    </main>
  )
}
