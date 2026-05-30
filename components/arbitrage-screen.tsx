"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Clock,
  Lock,
  Minus,
  Plus,
  Home,
  BarChart3,
  User,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent }       from "@/components/ui/card"
import { Button }                  from "@/components/ui/button"
import { Slider }                  from "@/components/ui/slider"
import { Progress }                from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useArbitrageWindow }      from "@/hooks/use-arbitrage-window"

// ── Mock data (remplacé par Supabase + Polygon dans la tâche 6) ──
const mockStocks = [
  { ticker: "AAPL",  name: "Apple Inc.",          sector: "Technology", price: 178.42, monthChange:  5.23 },
  { ticker: "MSFT",  name: "Microsoft Corp.",      sector: "Technology", price: 378.12, monthChange:  3.45 },
  { ticker: "GOOGL", name: "Alphabet Inc.",        sector: "Technology", price: 141.80, monthChange: -2.12 },
  { ticker: "AMZN",  name: "Amazon.com Inc.",      sector: "Consumer",   price: 178.25, monthChange:  8.67 },
  { ticker: "NVDA",  name: "NVIDIA Corp.",         sector: "Technology", price: 456.89, monthChange: 15.34 },
  { ticker: "TSLA",  name: "Tesla Inc.",           sector: "Automotive", price: 245.67, monthChange: -4.21 },
  { ticker: "META",  name: "Meta Platforms",       sector: "Technology", price: 505.95, monthChange: 12.45 },
  { ticker: "BRK.B", name: "Berkshire Hathaway",  sector: "Finance",    price: 408.23, monthChange:  2.11 },
  { ticker: "JPM",   name: "JPMorgan Chase",       sector: "Finance",    price: 198.45, monthChange:  4.56 },
  { ticker: "V",     name: "Visa Inc.",            sector: "Finance",    price: 279.34, monthChange:  1.89 },
  { ticker: "JNJ",   name: "Johnson & Johnson",   sector: "Healthcare", price: 156.78, monthChange: -1.23 },
  { ticker: "WMT",   name: "Walmart Inc.",         sector: "Retail",     price: 165.42, monthChange:  3.21 },
  { ticker: "PG",    name: "Procter & Gamble",     sector: "Consumer",   price: 158.90, monthChange:  0.87 },
  { ticker: "MA",    name: "Mastercard Inc.",      sector: "Finance",    price: 456.12, monthChange:  2.34 },
  { ticker: "UNH",   name: "UnitedHealth Group",  sector: "Healthcare", price: 523.45, monthChange: -0.56 },
  { ticker: "HD",    name: "Home Depot Inc.",      sector: "Retail",     price: 345.67, monthChange:  1.45 },
  { ticker: "NFLX",  name: "Netflix Inc.",         sector: "Entertainment", price: 478.90, monthChange: 9.12 },
  { ticker: "ADBE",  name: "Adobe Inc.",           sector: "Technology", price: 512.34, monthChange:  4.56 },
  { ticker: "CRM",   name: "Salesforce Inc.",      sector: "Technology", price: 267.89, monthChange:  7.23 },
  { ticker: "ORCL",  name: "Oracle Corp.",         sector: "Technology", price: 123.45, monthChange:  6.78 },
]

export function ArbitrageScreen() {
  const arbitrage = useArbitrageWindow()

  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    mockStocks.forEach((s) => { init[s.ticker] = 0 })
    return init
  })
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting]           = useState(false)

  const totalAllocation = useMemo(
    () => Object.values(allocations).reduce((sum, v) => sum + v, 0),
    [allocations]
  )
  const cashPct    = 100 - totalAllocation
  const isValid    = totalAllocation > 0 && totalAllocation <= 100
  const canSubmit  = arbitrage.isOpen && isValid

  const updateAllocation = (ticker: string, value: number) => {
    if (!arbitrage.isOpen) return
    setAllocations((prev) => {
      const current   = prev[ticker] ?? 0
      const otherSum  = totalAllocation - current
      // Ne pas dépasser 100% au total, ni 50% par action
      const maxForThis = Math.min(50, 100 - otherSum)
      return { ...prev, [ticker]: Math.max(0, Math.min(maxForThis, value)) }
    })
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 1500)) // TODO: Supabase upsert positions
    setIsSubmitting(false)
    setShowConfirmDialog(false)
  }

  return (
    <main className="flex min-h-svh flex-col bg-background pb-36">

      {/* ── Header statut fenêtre ──────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock
              className={`h-5 w-5 ${arbitrage.isOpen ? "text-success" : "text-danger"}`}
            />
            <span className="font-semibold text-foreground">
              {arbitrage.isOpen ? "Fenêtre ouverte" : "Fenêtre fermée"}
            </span>
          </div>

          <span className="font-mono text-sm text-muted-foreground">
            {arbitrage.isOpen ? (
              <>
                Ferme dans{" "}
                <span className="font-semibold text-success">
                  {arbitrage.timeUntilClose}
                </span>
              </>
            ) : (
              <>
                Ouvre dans{" "}
                <span className="font-semibold text-foreground">
                  {arbitrage.timeUntilOpen}
                </span>
              </>
            )}
          </span>
        </div>

        {/* Bandeau fermée */}
        {!arbitrage.isOpen && (
          <div className="flex items-center gap-2 border-t border-border/60 bg-secondary/60 px-4 py-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Les modifications sont possibles uniquement{" "}
              <span className="font-medium text-foreground">
                du samedi 08h00 au dimanche 21h00
              </span>{" "}
              (heure de Paris).
            </p>
          </div>
        )}
      </header>

      {/* ── Solde ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 px-4 py-6 border-b border-border">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Capital disponible
        </span>
        <span className="text-3xl font-bold tabular-nums text-foreground">
          100 000 €
        </span>
      </div>

      {/* ── Liste des actions ──────────────────────────────────── */}
      <div className="flex-1 px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Répartition du portfolio
          </h2>
          <span className="text-xs text-muted-foreground">Max 50 % par action</span>
        </div>

        <div className="flex flex-col gap-3">
          {mockStocks.map((stock) => (
            <Card
              key={stock.ticker}
              className={`border-border overflow-hidden transition-opacity ${
                arbitrage.isOpen ? "bg-card" : "bg-card opacity-60"
              }`}
            >
              <CardContent className="p-0">
                {/* Ligne infos + prix */}
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

                {/* Slider allocation */}
                <div className="flex items-center gap-3 p-3 bg-secondary/30">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() =>
                      updateAllocation(stock.ticker, allocations[stock.ticker] - 5)
                    }
                    disabled={!arbitrage.isOpen || allocations[stock.ticker] === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="flex flex-1 items-center gap-3">
                    <Slider
                      value={[allocations[stock.ticker]]}
                      onValueChange={([v]) => updateAllocation(stock.ticker, v)}
                      max={50}
                      step={1}
                      disabled={!arbitrage.isOpen}
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
                    onClick={() =>
                      updateAllocation(stock.ticker, allocations[stock.ticker] + 5)
                    }
                    disabled={!arbitrage.isOpen || allocations[stock.ticker] === 50}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Barre basse fixe ───────────────────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="px-4 pt-3 pb-4">

          {/* Récap investi / cash */}
          <div className="mb-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
              <span className="text-muted-foreground">Investi</span>
              <span className="font-bold text-foreground tabular-nums">{totalAllocation}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-secondary border border-border" />
              <span className="text-muted-foreground">Cash</span>
              <span className={`font-bold tabular-nums ${cashPct > 0 ? "text-green-500" : "text-muted-foreground"}`}>
                {cashPct}%
              </span>
            </div>
          </div>

          {/* Barre bicolore */}
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: `${totalAllocation}%` }}
            />
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!canSubmit}
            onClick={() => setShowConfirmDialog(true)}
          >
            {!arbitrage.isOpen ? (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Ouvre dans {arbitrage.timeUntilOpen}
              </span>
            ) : totalAllocation === 0 ? (
              "Sélectionne au moins 1 action"
            ) : (
              `Valider — ${totalAllocation}% investi, ${cashPct}% en cash`
            )}
          </Button>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────── */}
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

      {/* ── Dialog confirmation ───────────────────────────────── */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Confirmer l&apos;allocation
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir valider votre portfolio ? Cette action ne pourra
              pas être modifiée avant la prochaine fenêtre d&apos;arbitrage.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 rounded-lg bg-secondary/50 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Actions sélectionnées</span>
              <span className="font-semibold text-foreground">
                {Object.values(allocations).filter((v) => v > 0).length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Investi en actions</span>
              <span className="font-semibold text-foreground">{totalAllocation}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Conservé en cash</span>
              <span className={`font-semibold ${cashPct > 0 ? "text-green-500" : "text-muted-foreground"}`}>
                {cashPct}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">Fenêtre se ferme dans</span>
              <span className="font-mono font-semibold text-foreground">
                {arbitrage.timeUntilClose}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Validation…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
