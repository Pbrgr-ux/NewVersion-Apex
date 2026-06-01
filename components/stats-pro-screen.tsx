"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  BarChart3, 
  Home, 
  User, 
  Crown, 
  Lock, 
  TrendingUp, 
  Users, 
  Calendar,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data - replace with Supabase aggregated data
const lastSunday = (() => {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 7 : day
  const lastSun = new Date(now)
  lastSun.setDate(now.getDate() - diff)
  return lastSun
})()

const formatDate = (date: Date) => {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const topStocks = [
  { ticker: "NVDA", name: "NVIDIA", sector: "Tech", playersPercent: 78.4, avgAllocation: 18.2 },
  { ticker: "AAPL", name: "Apple", sector: "Tech", playersPercent: 72.1, avgAllocation: 15.8 },
  { ticker: "MSFT", name: "Microsoft", sector: "Tech", playersPercent: 68.9, avgAllocation: 14.2 },
  { ticker: "TSLA", name: "Tesla", sector: "Auto", playersPercent: 54.3, avgAllocation: 12.5 },
  { ticker: "AMZN", name: "Amazon", sector: "E-com", playersPercent: 51.7, avgAllocation: 11.8 },
  { ticker: "GOOGL", name: "Alphabet", sector: "Tech", playersPercent: 47.2, avgAllocation: 10.4 },
  { ticker: "META", name: "Meta", sector: "Tech", playersPercent: 42.8, avgAllocation: 9.6 },
  { ticker: "AMD", name: "AMD", sector: "Tech", playersPercent: 38.1, avgAllocation: 8.2 },
  { ticker: "JPM", name: "JPMorgan", sector: "Finance", playersPercent: 31.5, avgAllocation: 6.8 },
  { ticker: "V", name: "Visa", sector: "Finance", playersPercent: 28.9, avgAllocation: 5.4 },
]

const proVsFreeComparison = [
  { metric: "Avg. positions held", free: "4.2", pro: "7.8" },
  { metric: "Avg. allocation per stock", free: "23.8%", pro: "12.8%" },
  { metric: "Tech sector exposure", free: "72%", pro: "54%" },
  { metric: "Diversification score", free: "3.2/10", pro: "7.4/10" },
]

function HorizontalBar({ 
  ticker, 
  name, 
  sector, 
  playersPercent, 
  avgAllocation, 
  rank 
}: { 
  ticker: string
  name: string
  sector: string
  playersPercent: number
  avgAllocation: number
  rank: number
}) {
  const maxPercent = 78.4 // Max value for scaling

  return (
    <div className="flex items-center gap-3">
      {/* Rank */}
      <div className="flex h-6 w-6 items-center justify-center">
        <span className={`text-sm font-bold tabular-nums ${
          rank <= 3 ? "text-primary" : "text-muted-foreground"
        }`}>
          {rank}
        </span>
      </div>

      {/* Stock info */}
      <div className="flex w-20 flex-col">
        <span className="text-sm font-semibold text-foreground">{ticker}</span>
        <span className="text-[10px] text-muted-foreground">{sector}</span>
      </div>

      {/* Bar */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="relative h-6 w-full overflow-hidden rounded-md bg-secondary">
          <div
            className="absolute inset-y-0 left-0 flex items-center rounded-md bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
            style={{ width: `${(playersPercent / maxPercent) * 100}%` }}
          >
            <span className="ml-2 text-xs font-semibold text-primary-foreground">
              {playersPercent.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{name}</span>
          <span>Avg. {avgAllocation.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

function PaywallOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-background/60 backdrop-blur-md">
      <div className="flex flex-col items-center gap-3 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Stats Pro</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Unlock exclusive insights on how all players allocate their portfolios.
          See what the best traders are buying.
        </p>
      </div>
      <Button
        size="lg"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Crown className="mr-2 h-5 w-5" />
        Upgrade to Pro
      </Button>
      <p className="text-xs text-muted-foreground">Starting at 9.99/month</p>
    </div>
  )
}

export function StatsProScreen() {
  // Mock - replace with actual subscription status from Supabase
  const [isPro, setIsPro] = useState(true)

  // Toggle for demo purposes
  const togglePro = () => setIsPro(!isPro)

  return (
    <main className="relative flex min-h-svh flex-col bg-background pb-20">
      {/* Blurred Paywall Overlay */}
      {!isPro && <PaywallOverlay />}

      {/* Content */}
      <div className={!isPro ? "pointer-events-none select-none" : ""}>
        {/* Header */}
        <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Stats Pro</h1>
            <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Arbitrages du dimanche {formatDate(lastSunday)}</span>
          </div>
        </div>

        {/* Demo Toggle - Remove in production */}
        <div className="flex justify-center px-4 pb-4">
          <Button variant="outline" size="sm" onClick={togglePro}>
            {isPro ? "View as Free User" : "View as Pro User"}
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 px-4 pb-4">
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center gap-1 p-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-foreground">823</span>
              <span className="text-[10px] text-muted-foreground">Players</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center gap-1 p-3">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-lg font-bold text-foreground">41.2K</span>
              <span className="text-[10px] text-muted-foreground">Trades</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center gap-1 p-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-foreground">6.3</span>
              <span className="text-[10px] text-muted-foreground">Avg Stocks</span>
            </CardContent>
          </Card>
        </div>

        {/* Top 10 Stocks */}
        <div className="px-4 pb-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Crown className="h-4 w-4 text-primary" />
                Top 10 Most Picked Stocks
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {topStocks.map((stock, index) => (
                <HorizontalBar
                  key={stock.ticker}
                  rank={index + 1}
                  {...stock}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Pro vs Free Comparison */}
        <div className="px-4 pb-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Pro Players Play Differently
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                  <span className="text-xs text-muted-foreground">Metric</span>
                  <span className="text-center text-xs text-muted-foreground">Free</span>
                  <span className="text-center text-xs font-medium text-primary">Pro</span>
                </div>
                {/* Rows */}
                {proVsFreeComparison.map((row) => (
                  <div key={row.metric} className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-sm text-foreground">{row.metric}</span>
                    <span className="text-center text-sm text-muted-foreground">{row.free}</span>
                    <span className="text-center text-sm font-semibold text-primary">{row.pro}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data availability note */}
        <div className="px-4 pb-4">
          <p className="text-center text-xs text-muted-foreground">
            Data updated every Monday at 00:01 after the arbitrage window closes
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 border-t border-border bg-card/95 backdrop-blur-sm">
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
