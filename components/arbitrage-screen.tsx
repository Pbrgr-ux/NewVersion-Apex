"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Clock, Minus, Plus, Home, BarChart3, User, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock 50 stocks data - replace with Polygon.io
const mockStocks = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", price: 178.42, monthChange: 5.23 },
  { ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology", price: 378.12, monthChange: 3.45 },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", price: 141.80, monthChange: -2.12 },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer", price: 178.25, monthChange: 8.67 },
  { ticker: "NVDA", name: "NVIDIA Corp.", sector: "Technology", price: 456.89, monthChange: 15.34 },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Automotive", price: 245.67, monthChange: -4.21 },
  { ticker: "META", name: "Meta Platforms", sector: "Technology", price: 505.95, monthChange: 12.45 },
  { ticker: "BRK.B", name: "Berkshire Hathaway", sector: "Finance", price: 408.23, monthChange: 2.11 },
  { ticker: "JPM", name: "JPMorgan Chase", sector: "Finance", price: 198.45, monthChange: 4.56 },
  { ticker: "V", name: "Visa Inc.", sector: "Finance", price: 279.34, monthChange: 1.89 },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", price: 156.78, monthChange: -1.23 },
  { ticker: "WMT", name: "Walmart Inc.", sector: "Retail", price: 165.42, monthChange: 3.21 },
  { ticker: "PG", name: "Procter & Gamble", sector: "Consumer", price: 158.90, monthChange: 0.87 },
  { ticker: "MA", name: "Mastercard Inc.", sector: "Finance", price: 456.12, monthChange: 2.34 },
  { ticker: "UNH", name: "UnitedHealth Group", sector: "Healthcare", price: 523.45, monthChange: -0.56 },
  { ticker: "HD", name: "Home Depot Inc.", sector: "Retail", price: 345.67, monthChange: 1.45 },
  { ticker: "DIS", name: "Walt Disney Co.", sector: "Entertainment", price: 112.34, monthChange: 6.78 },
  { ticker: "PYPL", name: "PayPal Holdings", sector: "Finance", price: 62.45, monthChange: -3.45 },
  { ticker: "NFLX", name: "Netflix Inc.", sector: "Entertainment", price: 478.90, monthChange: 9.12 },
  { ticker: "ADBE", name: "Adobe Inc.", sector: "Technology", price: 512.34, monthChange: 4.56 },
  { ticker: "CRM", name: "Salesforce Inc.", sector: "Technology", price: 267.89, monthChange: 7.23 },
  { ticker: "INTC", name: "Intel Corp.", sector: "Technology", price: 31.45, monthChange: -8.90 },
  { ticker: "AMD", name: "AMD Inc.", sector: "Technology", price: 156.78, monthChange: 11.23 },
  { ticker: "CSCO", name: "Cisco Systems", sector: "Technology", price: 52.34, monthChange: 1.12 },
  { ticker: "PEP", name: "PepsiCo Inc.", sector: "Consumer", price: 178.56, monthChange: 0.45 },
  { ticker: "KO", name: "Coca-Cola Co.", sector: "Consumer", price: 62.34, monthChange: 1.67 },
  { ticker: "COST", name: "Costco Wholesale", sector: "Retail", price: 567.89, monthChange: 2.89 },
  { ticker: "TMO", name: "Thermo Fisher", sector: "Healthcare", price: 534.12, monthChange: 3.45 },
  { ticker: "ABT", name: "Abbott Labs", sector: "Healthcare", price: 112.34, monthChange: 1.23 },
  { ticker: "MRK", name: "Merck & Co.", sector: "Healthcare", price: 109.56, monthChange: -2.34 },
  { ticker: "PFE", name: "Pfizer Inc.", sector: "Healthcare", price: 28.90, monthChange: -5.67 },
  { ticker: "NKE", name: "Nike Inc.", sector: "Consumer", price: 98.45, monthChange: 4.12 },
  { ticker: "MCD", name: "McDonald's Corp.", sector: "Consumer", price: 289.67, monthChange: 1.89 },
  { ticker: "ORCL", name: "Oracle Corp.", sector: "Technology", price: 123.45, monthChange: 6.78 },
  { ticker: "IBM", name: "IBM Corp.", sector: "Technology", price: 167.89, monthChange: 2.34 },
  { ticker: "QCOM", name: "Qualcomm Inc.", sector: "Technology", price: 156.78, monthChange: 3.45 },
  { ticker: "TXN", name: "Texas Instruments", sector: "Technology", price: 178.90, monthChange: 1.56 },
  { ticker: "NOW", name: "ServiceNow Inc.", sector: "Technology", price: 712.34, monthChange: 8.90 },
  { ticker: "UBER", name: "Uber Technologies", sector: "Technology", price: 67.89, monthChange: 12.34 },
  { ticker: "BA", name: "Boeing Co.", sector: "Industrial", price: 212.45, monthChange: -4.56 },
  { ticker: "CAT", name: "Caterpillar Inc.", sector: "Industrial", price: 289.67, monthChange: 2.78 },
  { ticker: "GE", name: "General Electric", sector: "Industrial", price: 156.78, monthChange: 5.67 },
  { ticker: "XOM", name: "Exxon Mobil", sector: "Energy", price: 112.34, monthChange: -1.23 },
  { ticker: "CVX", name: "Chevron Corp.", sector: "Energy", price: 156.78, monthChange: -0.89 },
  { ticker: "COP", name: "ConocoPhillips", sector: "Energy", price: 112.45, monthChange: 1.34 },
  { ticker: "GS", name: "Goldman Sachs", sector: "Finance", price: 456.78, monthChange: 4.56 },
  { ticker: "MS", name: "Morgan Stanley", sector: "Finance", price: 98.67, monthChange: 3.21 },
  { ticker: "AXP", name: "American Express", sector: "Finance", price: 234.56, monthChange: 2.45 },
  { ticker: "SBUX", name: "Starbucks Corp.", sector: "Consumer", price: 98.12, monthChange: 1.78 },
  { ticker: "LMT", name: "Lockheed Martin", sector: "Industrial", price: 456.78, monthChange: 0.67 },
]

function getTimeUntilClose(): { hours: number; minutes: number; seconds: number } | null {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()

  // Window is Sunday 18:00-23:59
  if (day !== 0 || hour < 18) return null

  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  
  const diff = midnight.getTime() - now.getTime()
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { hours, minutes, seconds }
}

function isArbitrageOpen(): boolean {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  return day === 0 && hour >= 18
}

export function ArbitrageScreen() {
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    mockStocks.forEach((stock) => {
      initial[stock.ticker] = 0
    })
    return initial
  })
  const [countdown, setCountdown] = useState(getTimeUntilClose())
  const [isOpen, setIsOpen] = useState(isArbitrageOpen())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalAllocation = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + val, 0)
  }, [allocations])

  const isValid = totalAllocation === 100
  const balance = 100000

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilClose())
      setIsOpen(isArbitrageOpen())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const updateAllocation = (ticker: string, value: number) => {
    const newValue = Math.max(0, Math.min(50, value))
    setAllocations((prev) => ({
      ...prev,
      [ticker]: newValue,
    }))
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    // Simulate API call to Supabase
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setShowConfirmDialog(false)
    // Would redirect to dashboard or show success
  }

  // Force open for demo purposes - remove in production
  const demoIsOpen = true

  return (
    <main className="flex min-h-svh flex-col bg-background pb-36">
      {/* Header with countdown */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-success" />
            <span className="font-semibold text-foreground">Window Open</span>
          </div>
          {countdown ? (
            <span className="font-mono text-sm text-muted-foreground">
              Closes in{" "}
              <span className="text-foreground">
                {countdown.hours}h {String(countdown.minutes).padStart(2, "0")}m{" "}
                {String(countdown.seconds).padStart(2, "0")}s
              </span>
            </span>
          ) : (
            <span className="font-mono text-sm text-success">Demo Mode</span>
          )}
        </div>
      </header>

      {/* Balance display */}
      <div className="flex flex-col items-center gap-1 px-4 py-6 border-b border-border">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Available Balance
        </span>
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {balance.toLocaleString("fr-FR")} €
        </span>
      </div>

      {/* Stocks list */}
      <div className="flex-1 px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Select Allocations
          </h2>
          <span className="text-xs text-muted-foreground">Max 50% per stock</span>
        </div>

        <div className="flex flex-col gap-3">
          {mockStocks.map((stock) => (
            <Card key={stock.ticker} className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-foreground">
                      {stock.ticker.slice(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{stock.ticker}</span>
                        <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          {stock.sector}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stock.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium tabular-nums text-foreground">
                      ${stock.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-medium tabular-nums ${
                        stock.monthChange >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {stock.monthChange >= 0 ? "+" : ""}
                      {stock.monthChange.toFixed(2)}% /mo
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/30">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => updateAllocation(stock.ticker, allocations[stock.ticker] - 5)}
                    disabled={allocations[stock.ticker] === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="flex flex-1 items-center gap-3">
                    <Slider
                      value={[allocations[stock.ticker]]}
                      onValueChange={([value]) => updateAllocation(stock.ticker, value)}
                      max={50}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-12 text-right font-mono text-sm font-semibold text-foreground tabular-nums">
                      {allocations[stock.ticker]}%
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => updateAllocation(stock.ticker, allocations[stock.ticker] + 5)}
                    disabled={allocations[stock.ticker] === 50}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom fixed section */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="px-4 py-4">
          {/* Allocation recap */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Allocated</span>
            <span
              className={`text-lg font-bold tabular-nums ${
                totalAllocation === 100
                  ? "text-success"
                  : totalAllocation > 100
                    ? "text-danger"
                    : "text-foreground"
              }`}
            >
              {totalAllocation}%
              <span className="text-sm font-normal text-muted-foreground"> / 100%</span>
            </span>
          </div>

          {/* Progress bar */}
          <Progress
            value={Math.min(totalAllocation, 100)}
            className={`h-3 mb-4 ${
              totalAllocation === 100
                ? "[&>[data-slot=progress-indicator]]:bg-success"
                : totalAllocation > 100
                  ? "[&>[data-slot=progress-indicator]]:bg-danger"
                  : ""
            }`}
          />

          {/* Validate button */}
          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            disabled={!isValid}
            onClick={() => setShowConfirmDialog(true)}
          >
            {totalAllocation < 100
              ? `Allocate ${100 - totalAllocation}% more`
              : totalAllocation > 100
                ? `Remove ${totalAllocation - 100}%`
                : "VALIDATE ALLOCATION"}
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
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </nav>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Confirm your allocation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to validate your portfolio allocation? This action cannot be
              undone until the next arbitrage window.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Stocks selected</span>
              <span className="font-semibold text-foreground">
                {Object.values(allocations).filter((v) => v > 0).length}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total allocation</span>
              <span className="font-semibold text-success">100%</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Validating..." : "Confirm Allocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
