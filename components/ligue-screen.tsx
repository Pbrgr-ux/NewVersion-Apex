"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Lock, Users, Copy, Check, Crown, Medal, TrendingUp, TrendingDown,
  Home, BarChart3, User, LogOut, Shield,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const currentUserId = "user-47"

type LeagueMember = {
  id: string
  pseudo: string
  perf: number
  weekChange: number
  isPro: boolean
}

type League = {
  id: string
  name: string
  code: string
  creatorId: string
  members: LeagueMember[]
}

const MOCK_LEAGUES: Record<string, League> = {
  "alpha-wolves": {
    id: "alpha-wolves",
    name: "Alpha Wolves",
    code: "WOLF-42",
    creatorId: "user-1",
    members: [
      { id: "user-1",  pseudo: "AlphaTrader",    perf: 48.72, weekChange:  3.21, isPro: true  },
      { id: "user-2",  pseudo: "WallStreetWolf",  perf: 45.31, weekChange: -1.45, isPro: true  },
      { id: "user-4",  pseudo: "BullRunner",      perf: 38.56, weekChange:  1.12, isPro: true  },
      { id: "user-5",  pseudo: "MarketMaven",     perf: 35.24, weekChange: -0.34, isPro: false },
      { id: "user-7",  pseudo: "StockSage",       perf: 31.78, weekChange:  0.89, isPro: true  },
      { id: "user-47", pseudo: "TradingWolf",     perf: 28.40, weekChange:  2.15, isPro: true  },
      { id: "user-9",  pseudo: "PortfolioPro",    perf: 27.32, weekChange:  1.56, isPro: true  },
      { id: "user-10", pseudo: "InvestorX",       perf: 25.18, weekChange:  0.43, isPro: false },
    ],
  },
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-4 w-4 text-amber-400" />
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-300" />
  if (rank === 3) return <Medal className="h-4 w-4 text-orange-400" />
  return null
}

function MemberRow({ member, rank, isCurrentUser }: { member: LeagueMember; rank: number; isCurrentUser: boolean }) {
  const icon = getRankIcon(rank)
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        isCurrentUser
          ? "border-[var(--signup-blue)] bg-[var(--signup-blue)]/10"
          : rank <= 3
          ? "border-primary/20 bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      {/* Rank */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center">
        {icon ?? (
          <span className="text-xs font-bold tabular-nums text-muted-foreground">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-secondary text-foreground text-[10px] font-semibold">
          {member.pseudo.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <span
          className={`truncate text-sm font-semibold ${
            isCurrentUser ? "text-[var(--signup-blue)]" : rank <= 3 ? "text-primary" : "text-foreground"
          }`}
        >
          {member.pseudo}
          {isCurrentUser && <span className="ml-1 text-xs font-normal text-muted-foreground">(vous)</span>}
        </span>
        {member.isPro && (
          <Badge variant="secondary" className="bg-primary/20 text-primary text-[10px] px-1.5 py-0 shrink-0">
            PRO
          </Badge>
        )}
      </div>

      {/* Perf */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className={`text-sm font-bold tabular-nums ${member.perf >= 0 ? "text-success" : "text-danger"}`}>
          {member.perf >= 0 ? "+" : ""}{member.perf.toFixed(2)}%
        </span>
        <div className="flex items-center gap-0.5">
          {member.weekChange >= 0
            ? <TrendingUp className="h-2.5 w-2.5 text-success" />
            : <TrendingDown className="h-2.5 w-2.5 text-danger" />
          }
          <span className={`text-[10px] tabular-nums ${member.weekChange >= 0 ? "text-success" : "text-danger"}`}>
            {member.weekChange >= 0 ? "+" : ""}{member.weekChange.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export function LigueScreen({ id }: { id: string }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const league = MOCK_LEAGUES[id] ?? MOCK_LEAGUES["alpha-wolves"]
  const sorted = [...league.members].sort((a, b) => b.perf - a.perf)
  const myRank = sorted.findIndex((m) => m.id === currentUserId) + 1
  const isCreator = league.creatorId === currentUserId

  function handleCopy() {
    navigator.clipboard.writeText(league.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleLeave() {
    // In prod: DELETE from league_members WHERE league_id = league.id AND user_id = currentUserId
    router.push("/ligue")
  }

  return (
    <main className="flex min-h-svh flex-col bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <Link href="/ligue" className="text-xs text-muted-foreground hover:text-foreground">
          ← Mes ligues
        </Link>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{league.name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{league.members.length} membres · Season 2025</span>
              </div>
            </div>
          </div>
          {isCreator && (
            <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
              <Shield className="h-3 w-3 mr-1" />
              Créateur
            </Badge>
          )}
        </div>
      </div>

      {/* Invite code */}
      <div className="mx-4 mb-4 flex items-center justify-between rounded-xl border border-primary/25 bg-primary/8 px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Code d'invitation</p>
          <p className="mt-0.5 font-mono text-lg font-bold tracking-widest text-primary">{league.code}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
            copied
              ? "bg-success/20 text-success"
              : "bg-primary/20 text-primary hover:bg-primary/30"
          }`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>

      {/* My position banner */}
      {myRank > 0 && (
        <div className="mx-4 mb-4 flex items-center justify-between rounded-xl border border-[var(--signup-blue)]/30 bg-[var(--signup-blue)]/8 px-4 py-3">
          <span className="text-xs text-muted-foreground">Votre position</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[var(--signup-blue)]">
              #{myRank} / {league.members.length}
            </span>
            <span className={`text-sm font-bold tabular-nums ${sorted[myRank - 1]?.perf >= 0 ? "text-success" : "text-danger"}`}>
              {sorted[myRank - 1]?.perf >= 0 ? "+" : ""}{sorted[myRank - 1]?.perf.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="px-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Classement interne
        </p>
        <div className="flex flex-col gap-2">
          {sorted.map((member, i) => (
            <MemberRow
              key={member.id}
              member={member}
              rank={i + 1}
              isCurrentUser={member.id === currentUserId}
            />
          ))}
        </div>
      </div>

      {/* Leave button */}
      <div className="mx-4 mt-6">
        {!showLeaveConfirm ? (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 px-4 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" />
            Quitter la ligue
          </button>
        ) : (
          <div className="rounded-xl border border-danger/40 bg-danger/8 p-4">
            <p className="text-center text-sm text-foreground font-medium mb-3">
              Quitter {league.name} ?
            </p>
            <p className="text-center text-xs text-muted-foreground mb-4">
              Tu perdras ta position dans cette ligue.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground"
              >
                Annuler
              </button>
              <button
                onClick={handleLeave}
                className="flex-1 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white"
              >
                Quitter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-around py-2">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>
          <Link href="/classement" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] font-medium">Classement</span>
          </Link>
          <Link href="/profil" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    </main>
  )
}
