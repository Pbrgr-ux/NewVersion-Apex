"use client"

import { useState } from "react"
import Link from "next/link"
import { Trophy, TrendingUp, TrendingDown, Home, BarChart3, User, Crown, Medal } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Mock data - replace with Supabase data
const currentUserId = "user-47"

const mockLeaderboard = [
  { id: "user-1", rank: 1, pseudo: "AlphaTrader", avatar: null, perf: 48.72, weekChange: 3.21, isPro: true },
  { id: "user-2", rank: 2, pseudo: "WallStreetWolf", avatar: null, perf: 45.31, weekChange: -1.45, isPro: true },
  { id: "user-3", rank: 3, pseudo: "CryptoKing", avatar: null, perf: 42.89, weekChange: 2.87, isPro: false },
  { id: "user-4", rank: 4, pseudo: "BullRunner", avatar: null, perf: 38.56, weekChange: 1.12, isPro: true },
  { id: "user-5", rank: 5, pseudo: "MarketMaven", avatar: null, perf: 35.24, weekChange: -0.34, isPro: false },
  { id: "user-6", rank: 6, pseudo: "TradeMaster", avatar: null, perf: 33.91, weekChange: 2.15, isPro: false },
  { id: "user-7", rank: 7, pseudo: "StockSage", avatar: null, perf: 31.78, weekChange: 0.89, isPro: true },
  { id: "user-8", rank: 8, pseudo: "EquityElite", avatar: null, perf: 29.45, weekChange: -2.01, isPro: false },
  { id: "user-9", rank: 9, pseudo: "PortfolioPro", avatar: null, perf: 27.32, weekChange: 1.56, isPro: true },
  { id: "user-10", rank: 10, pseudo: "InvestorX", avatar: null, perf: 25.18, weekChange: 0.43, isPro: false },
  ...Array.from({ length: 90 }, (_, i) => ({
    id: i === 36 ? "user-47" : `user-${i + 11}`,
    rank: i + 11,
    pseudo: i === 36 ? "You" : `Trader${i + 11}`,
    avatar: null,
    perf: Math.max(0, 24 - i * 0.25 + (i % 7) * 0.3 - (i % 3) * 0.1).toFixed(2),
    weekChange: (((i % 5) - 2) * 0.7).toFixed(2),
    isPro: i % 3 === 0,
  })),
].map((item, index) => ({
  ...item,
  rank: index + 1,
  perf: typeof item.perf === "string" ? parseFloat(item.perf) : item.perf,
  weekChange: typeof item.weekChange === "string" ? parseFloat(item.weekChange) : item.weekChange,
}))

type FilterType = "general" | "league"
type PeriodType = "today" | "week" | "month" | "season"

function getRankStyle(rank: number): { bg: string; text: string; icon: React.ReactNode } {
  switch (rank) {
    case 1:
      return {
        bg: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50",
        text: "text-amber-400",
        icon: <Crown className="h-5 w-5 text-amber-400" />,
      }
    case 2:
      return {
        bg: "bg-gradient-to-r from-slate-400/20 to-gray-400/20 border-slate-400/50",
        text: "text-slate-300",
        icon: <Medal className="h-5 w-5 text-slate-300" />,
      }
    case 3:
      return {
        bg: "bg-gradient-to-r from-orange-600/20 to-amber-700/20 border-orange-600/50",
        text: "text-orange-400",
        icon: <Medal className="h-5 w-5 text-orange-400" />,
      }
    default:
      return {
        bg: "bg-card border-border",
        text: "text-muted-foreground",
        icon: null,
      }
  }
}

function LeaderboardRow({
  player,
  isCurrentUser,
}: {
  player: (typeof mockLeaderboard)[0]
  isCurrentUser: boolean
}) {
  const rankStyle = getRankStyle(player.rank)
  const isTop3 = player.rank <= 3

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        isCurrentUser
          ? "border-[var(--signup-blue)] bg-[var(--signup-blue)]/10"
          : rankStyle.bg
      }`}
    >
      {/* Rank */}
      <div className={`flex h-8 w-8 items-center justify-center ${isTop3 ? "" : ""}`}>
        {rankStyle.icon || (
          <span className={`text-sm font-bold tabular-nums ${rankStyle.text}`}>
            #{player.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={player.avatar || undefined} />
        <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
          {player.pseudo.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name & Badge */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`truncate font-semibold ${
              isCurrentUser ? "text-[var(--signup-blue)]" : "text-foreground"
            } ${isTop3 ? rankStyle.text : ""}`}
          >
            {player.pseudo}
          </span>
          {player.isPro && (
            <Badge
              variant="secondary"
              className="bg-primary/20 text-primary text-[10px] px-1.5 py-0"
            >
              PRO
            </Badge>
          )}
        </div>
        {isTop3 && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {player.rank === 1 ? "1st Place" : player.rank === 2 ? "2nd Place" : "3rd Place"}
          </span>
        )}
      </div>

      {/* Performance */}
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={`text-base font-bold tabular-nums ${
            player.perf >= 0 ? "text-success" : "text-danger"
          }`}
        >
          {player.perf >= 0 ? "+" : ""}
          {player.perf.toFixed(2)}%
        </span>
        <div className="flex items-center gap-0.5">
          {player.weekChange >= 0 ? (
            <TrendingUp className="h-3 w-3 text-success" />
          ) : (
            <TrendingDown className="h-3 w-3 text-danger" />
          )}
          <span
            className={`text-xs tabular-nums ${
              player.weekChange >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {player.weekChange >= 0 ? "+" : ""}
            {player.weekChange.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export function ClassementScreen() {
  const [filter, setFilter] = useState<FilterType>("general")
  const [period, setPeriod] = useState<PeriodType>("season")

  // Find current user position
  const currentUserIndex = mockLeaderboard.findIndex((p) => p.id === currentUserId)

  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Classement</h1>
        </div>
        <p className="text-sm text-muted-foreground">Season 2025</p>
      </div>

      {/* Filter Toggle */}
      <div className="flex justify-center gap-2 px-4 pb-2">
        <Button
          size="sm"
          variant={filter === "general" ? "default" : "outline"}
          onClick={() => setFilter("general")}
          className={filter === "general" ? "bg-primary text-primary-foreground" : ""}
        >
          General
        </Button>
        <Button
          size="sm"
          variant={filter === "league" ? "default" : "outline"}
          onClick={() => setFilter("league")}
          className={filter === "league" ? "bg-primary text-primary-foreground" : ""}
        >
          My League
        </Button>
      </div>

      {/* Period Tabs */}
      <div className="px-4 py-2">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <TabsList className="w-full">
            <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
            <TabsTrigger value="week" className="flex-1">Week</TabsTrigger>
            <TabsTrigger value="month" className="flex-1">Month</TabsTrigger>
            <TabsTrigger value="season" className="flex-1">Season</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="mt-4">
            {/* Top 3 Podium */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {/* 2nd Place */}
              <div className="flex flex-col items-center gap-2 pt-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 ring-2 ring-slate-400">
                    <AvatarFallback className="bg-gradient-to-br from-slate-400 to-gray-500 text-white font-bold">
                      {mockLeaderboard[1].pseudo.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-400 text-[10px] font-bold text-white">
                    2
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground truncate max-w-full px-1">
                  {mockLeaderboard[1].pseudo}
                </span>
                <span className="text-sm font-bold text-success tabular-nums">
                  +{mockLeaderboard[1].perf.toFixed(1)}%
                </span>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center gap-2">
                <Crown className="h-6 w-6 text-amber-400" />
                <div className="relative">
                  <Avatar className="h-16 w-16 ring-2 ring-amber-400">
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-yellow-500 text-white font-bold text-lg">
                      {mockLeaderboard[0].pseudo.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-white">
                    1
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground truncate max-w-full px-1">
                  {mockLeaderboard[0].pseudo}
                </span>
                <span className="text-base font-bold text-success tabular-nums">
                  +{mockLeaderboard[0].perf.toFixed(1)}%
                </span>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center gap-2 pt-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 ring-2 ring-orange-500">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold">
                      {mockLeaderboard[2].pseudo.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                    3
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground truncate max-w-full px-1">
                  {mockLeaderboard[2].pseudo}
                </span>
                <span className="text-sm font-bold text-success tabular-nums">
                  +{mockLeaderboard[2].perf.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Leaderboard List */}
            <div className="flex flex-col gap-2">
              {mockLeaderboard.slice(3).map((player) => (
                <LeaderboardRow
                  key={player.id}
                  player={player}
                  isCurrentUser={player.id === currentUserId}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-around py-2">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>
          <Link
            href="/classement"
            className="flex flex-col items-center gap-1 px-4 py-2 text-primary"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] font-medium">Classement</span>
          </Link>
          <Link
            href="/profil"
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    </main>
  )
}
