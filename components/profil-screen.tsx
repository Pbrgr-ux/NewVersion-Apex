"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Crown,
  LogOut,
  CreditCard,
  Calendar,
  Trophy,
  TrendingUp,
  Zap,
  Star,
  Home,
  BarChart3,
  User,
  ChevronRight,
  Loader2,
  KeyRound,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

// Mock user data
const mockUser = {
  pseudo: "TradingWolf",
  avatar: null,
  memberSince: "2024-03-15",
  isPro: true,
}

// Mock performance history for chart
const mockPerformanceHistory = [
  { month: "Jan", value: 0 },
  { month: "Feb", value: 4.2 },
  { month: "Mar", value: 8.7 },
  { month: "Apr", value: 6.3 },
  { month: "May", value: 12.4 },
  { month: "Jun", value: 18.9 },
  { month: "Jul", value: 15.2 },
  { month: "Aug", value: 22.1 },
  { month: "Sep", value: 28.6 },
  { month: "Oct", value: 25.3 },
  { month: "Nov", value: 31.8 },
  { month: "Dec", value: 38.4 },
]

// Mock stats
const mockStats = {
  bestSeason: { rank: 12, perf: 45.6 },
  avgAlpha: 8.3,
  seasonsPlayed: 4,
}

// Mock season history
const mockSeasonHistory = [
  { season: "S4 - 2024", rank: 47, total: 823, perf: 28.92 },
  { season: "S3 - 2024", rank: 12, total: 756, perf: 45.6 },
  { season: "S2 - 2024", rank: 89, total: 612, perf: 18.4 },
  { season: "S1 - 2024", rank: 234, total: 498, perf: 8.7 },
]

// Mock favorite stocks
const mockFavoriteStocks = [
  { ticker: "NVDA", name: "NVIDIA", timesChosen: 12, avgAllocation: 28 },
  { ticker: "AAPL", name: "Apple", timesChosen: 10, avgAllocation: 22 },
  { ticker: "TSLA", name: "Tesla", timesChosen: 8, avgAllocation: 18 },
  { ticker: "MSFT", name: "Microsoft", timesChosen: 7, avgAllocation: 15 },
]

function PerformanceChart({ data }: { data: { month: string; value: number }[] }) {
  const maxValue = Math.max(...data.map((d) => d.value))
  const minValue = Math.min(...data.map((d) => d.value))
  const range = maxValue - minValue || 1
  const height = 120
  const width = 100

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((d.value - minValue) / range) * height
      return `${x},${y}`
    })
    .join(" ")

  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <div className="relative h-32 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#chartGradient)" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[9px] text-muted-foreground">
        {data.filter((_, i) => i % 3 === 0).map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </div>
  )
}

export function ProfilScreen() {
  const router = useRouter()
  const supabase = createClient()
  const [isPro] = useState(mockUser.isPro)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogOut() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const memberDate = new Date(mockUser.memberSince)
  const formattedDate = memberDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  })

  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">
      {/* Header with Avatar */}
      <div className="flex flex-col items-center gap-4 px-6 pt-8 pb-6">
        <Avatar className="h-24 w-24 border-2 border-primary">
          <AvatarImage src={mockUser.avatar || undefined} alt={mockUser.pseudo} />
          <AvatarFallback className="bg-secondary text-2xl font-bold text-foreground">
            {mockUser.pseudo.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{mockUser.pseudo}</h1>
            {isPro && (
              <Badge className="bg-primary text-primary-foreground">
                <Crown className="mr-1 h-3 w-3" />
                PRO
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Member since {formattedDate}</span>
          </div>
        </div>

        {!isPro && (
          <Button className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>
        )}
      </div>

      {/* Performance Chart */}
      <div className="px-4 py-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Performance History
            </h3>
            <PerformanceChart data={mockPerformanceHistory} />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Return</span>
              <span className="text-lg font-bold text-success">+38.4%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 py-2">
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center gap-1 p-3">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Best Rank
            </span>
            <span className="text-lg font-bold text-foreground">#{mockStats.bestSeason.rank}</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center gap-1 p-3">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Avg Alpha
            </span>
            <span className="text-lg font-bold text-success">+{mockStats.avgAlpha}%</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center gap-1 p-3">
            <Star className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Seasons
            </span>
            <span className="text-lg font-bold text-foreground">{mockStats.seasonsPlayed}</span>
          </CardContent>
        </Card>
      </div>

      {/* Season History */}
      <div className="px-4 py-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Season History
        </h3>
        <div className="flex flex-col gap-2">
          {mockSeasonHistory.map((season, index) => (
            <Card key={season.season} className="bg-card border-border">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    #{season.rank}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{season.season}</span>
                    <span className="text-xs text-muted-foreground">
                      out of {season.total} players
                    </span>
                  </div>
                </div>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    season.perf >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {season.perf >= 0 ? "+" : ""}
                  {season.perf}%
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Favorite Stocks */}
      <div className="px-4 py-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Your Favorite Stocks
        </h3>
        <Card className="bg-card border-border">
          <CardContent className="divide-y divide-border p-0">
            {mockFavoriteStocks.map((stock) => (
              <div key={stock.ticker} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                    {stock.ticker.slice(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{stock.ticker}</span>
                    <span className="text-xs text-muted-foreground">{stock.name}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-foreground">
                    {stock.timesChosen}x chosen
                  </span>
                  <span className="text-xs text-muted-foreground">
                    avg {stock.avgAllocation}% allocation
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Account Actions */}
      <div className="px-4 py-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Account
        </h3>
        <div className="flex flex-col gap-2">
          {isPro && (
            <Button
              variant="outline"
              className="h-12 justify-between border-border bg-card text-foreground hover:bg-secondary"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <span>Manage Subscription</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          <Button
            variant="outline"
            className="h-12 justify-between border-border bg-card text-foreground hover:bg-secondary"
            onClick={() => router.push("/profil/changer-mot-de-passe")}
          >
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <span>Changer le mot de passe</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="outline"
            onClick={handleLogOut}
            disabled={loggingOut}
            className="h-12 justify-between border-border bg-card text-foreground hover:bg-secondary disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              {loggingOut
                ? <Loader2 className="h-5 w-5 animate-spin text-danger" />
                : <LogOut className="h-5 w-5 text-danger" />
              }
              <span>{loggingOut ? "Déconnexion…" : "Log Out"}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
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
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] font-medium">Classement</span>
          </Link>
          <Link
            href="/profil"
            className="flex flex-col items-center gap-1 px-4 py-2 text-primary"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    </main>
  )
}
