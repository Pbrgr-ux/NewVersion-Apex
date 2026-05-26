"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, Clock, Trophy, BarChart3, User, Home } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MiniSparkline } from "@/components/mini-sparkline"

// Mock data - replace with real data from Supabase/Polygon.io
const mockPositions = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    allocation: 25,
    price: 178.42,
    change: 2.34,
    changePercent: 1.33,
    sparkline: [172, 174, 173, 176, 178],
  },
  {
    ticker: "TSLA",
    name: "Tesla Inc.",
    allocation: 20,
    price: 245.67,
    change: -4.21,
    changePercent: -1.69,
    sparkline: [252, 248, 250, 247, 245],
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corp.",
    allocation: 30,
    price: 456.89,
    change: 12.45,
    changePercent: 2.80,
    sparkline: [440, 445, 448, 452, 456],
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    allocation: 25,
    price: 378.12,
    change: 1.89,
    changePercent: 0.50,
    sparkline: [375, 374, 376, 377, 378],
  },
]

const mockPerformance = {
  day: 2.34,
  week: 5.67,
  month: 12.45,
  season: 28.92,
}

const mockRanking = {
  current: 47,
  total: 823,
}

function isArbitrageOpen(): boolean {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  // Sunday (0) from 18:00 to 23:59
  return day === 0 && hour >= 18
}

function getTimeUntilNextWindow(): { days: number; hours: number; minutes: number; seconds: number } {
  const now = new Date()
  const currentDay = now.getDay()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentSeconds = now.getSeconds()

  // Calculate days until next Sunday
  let daysUntilSunday = (7 - currentDay) % 7
  
  // If it's Sunday but before 18:00, it's still this Sunday
  if (currentDay === 0 && currentHour < 18) {
    daysUntilSunday = 0
  }
  // If it's Sunday after midnight (window closed), next Sunday
  if (currentDay === 0 && currentHour >= 18) {
    daysUntilSunday = 7
  }

  // Target is Sunday 18:00:00
  const target = new Date(now)
  target.setDate(now.getDate() + daysUntilSunday)
  target.setHours(18, 0, 0, 0)

  const diff = target.getTime() - now.getTime()
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

export function DashboardScreen() {
  const [countdown, setCountdown] = useState(getTimeUntilNextWindow())
  const [isOpen, setIsOpen] = useState(isArbitrageOpen())

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilNextWindow())
      setIsOpen(isArbitrageOpen())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const dayPositive = mockPerformance.day >= 0

  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">
      {/* Daily Performance Banner */}
      <div className="flex flex-col items-center gap-2 px-6 pt-8 pb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {"Today's Performance"}
        </span>
        <div className="flex items-center gap-2">
          {dayPositive ? (
            <TrendingUp className="h-8 w-8 text-success" />
          ) : (
            <TrendingDown className="h-8 w-8 text-danger" />
          )}
          <span
            className={`text-5xl font-bold tabular-nums ${
              dayPositive ? "text-success" : "text-danger"
            }`}
          >
            {dayPositive ? "+" : ""}
            {mockPerformance.day.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center gap-1 p-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Week
            </span>
            <span
              className={`text-lg font-bold tabular-nums ${
                mockPerformance.week >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {mockPerformance.week >= 0 ? "+" : ""}
              {mockPerformance.week.toFixed(2)}%
            </span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center gap-1 p-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Month
            </span>
            <span
              className={`text-lg font-bold tabular-nums ${
                mockPerformance.month >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {mockPerformance.month >= 0 ? "+" : ""}
              {mockPerformance.month.toFixed(2)}%
            </span>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center gap-1 p-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Season
            </span>
            <span
              className={`text-lg font-bold tabular-nums ${
                mockPerformance.season >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {mockPerformance.season >= 0 ? "+" : ""}
              {mockPerformance.season.toFixed(2)}%
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Arbitrage Window Button */}
      <div className="px-4 py-4">
        {isOpen ? (
          <Link href="/arbitrage">
            <Button
              size="lg"
              className="w-full h-16 text-lg font-semibold bg-success text-success-foreground hover:bg-success/90"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>ARBITRAGE WINDOW</span>
                </div>
                <span className="text-sm font-normal opacity-90">Open now</span>
              </div>
            </Button>
          </Link>
        ) : (
          <Button
            size="lg"
            className="w-full h-16 text-lg font-semibold bg-muted text-muted-foreground cursor-not-allowed"
            disabled
          >
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>ARBITRAGE WINDOW</span>
              </div>
              <span className="text-xs font-mono opacity-75">
                {countdown.days}d {String(countdown.hours).padStart(2, "0")}h{" "}
                {String(countdown.minutes).padStart(2, "0")}m{" "}
                {String(countdown.seconds).padStart(2, "0")}s
              </span>
            </div>
          </Button>
        )}
      </div>

      {/* Current Ranking */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm font-medium text-muted-foreground">Your Ranking</span>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold text-foreground">
            #{mockRanking.current}
            <span className="text-sm font-normal text-muted-foreground">
              /{mockRanking.total}
            </span>
          </span>
        </div>
      </div>

      {/* Positions List */}
      <div className="flex-1 px-4 py-2">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Current Positions
        </h3>
        <div className="flex flex-col gap-2">
          {mockPositions.map((position) => (
            <Card key={position.ticker} className="bg-card border-border">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  {/* Logo placeholder */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                    {position.ticker.slice(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{position.ticker}</span>
                    <span className="text-xs text-muted-foreground">{position.allocation}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <MiniSparkline data={position.sparkline} positive={position.changePercent >= 0} />
                  <div className="flex flex-col items-end">
                    <span className="font-medium tabular-nums text-foreground">
                      ${position.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-medium tabular-nums ${
                        position.changePercent >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {position.changePercent >= 0 ? "+" : ""}
                      {position.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-around py-2">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 px-4 py-2 text-primary"
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
