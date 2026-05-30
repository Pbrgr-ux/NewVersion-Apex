"use client"

import Link from "next/link"
import {
  TrendingUp, TrendingDown, Clock, Trophy,
  BarChart3, User, Home, Lock, Wallet,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button }            from "@/components/ui/button"
import { MiniSparkline }     from "@/components/mini-sparkline"
import { useArbitrageWindow } from "@/hooks/use-arbitrage-window"
import type { DashboardData } from "@/lib/dashboard-data"

// ── Helpers d'affichage ───────────────────────────────────────
function fmtPerf(v: number | null): string {
  if (v === null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
}

function perfColor(v: number | null): string {
  if (v === null) return "text-muted-foreground"
  return v >= 0 ? "text-success" : "text-danger"
}

// ── Composant principal ───────────────────────────────────────
export function DashboardScreen({ data }: { data: DashboardData }) {
  const arbitrage = useArbitrageWindow()

  const { perf, positions, classement, hasPortfolio } = data
  const dayPositive = (perf.day ?? 0) >= 0

  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">

      {/* ── Perf du jour ─────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2 px-6 pt-8 pb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Performance du jour
        </span>
        <div className="flex items-center gap-2">
          {perf.day === null ? (
            <span className="text-5xl font-bold text-muted-foreground">—</span>
          ) : (
            <>
              {dayPositive
                ? <TrendingUp   className="h-8 w-8 text-success" />
                : <TrendingDown className="h-8 w-8 text-danger"  />
              }
              <span className={`text-5xl font-bold tabular-nums ${perfColor(perf.day)}`}>
                {fmtPerf(perf.day)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Cards perf semaine / mois / saison ───────────────── */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        {(
          [
            { label: "Semaine", value: perf.week   },
            { label: "Mois",    value: perf.month  },
            { label: "Saison",  value: perf.season },
          ] as const
        ).map(({ label, value }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="flex flex-col items-center gap-0.5 px-2 py-2">
              <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <span className={`text-base font-bold tabular-nums ${perfColor(value)}`}>
                {fmtPerf(value)}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Bouton fenêtre d'arbitrage ────────────────────────── */}
      <div className="px-4 pb-4">
        {arbitrage.isOpen ? (
          <Link href="/arbitrage">
            <Button
              size="lg"
              className="w-full h-16 text-lg font-semibold bg-success text-success-foreground hover:bg-success/90"
            >
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>Fenêtre d&apos;arbitrage</span>
                </div>
                <span className="text-sm font-normal opacity-90">
                  Ferme dans {arbitrage.timeUntilClose}
                </span>
              </div>
            </Button>
          </Link>
        ) : (
          <Button
            size="lg"
            className="w-full h-16 font-semibold bg-secondary text-secondary-foreground cursor-not-allowed"
            disabled
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="text-base">Fenêtre fermée</span>
              </div>
              <span className="font-mono text-xs opacity-75">
                Ouvre dans {arbitrage.timeUntilOpen}
              </span>
            </div>
          </Button>
        )}
      </div>

      {/* ── Classement ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-y border-border">
        <span className="text-sm font-medium text-muted-foreground">Votre classement</span>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          {classement.rang != null ? (
            <span className="text-lg font-bold text-foreground">
              #{classement.rang}
              {classement.total > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  /{classement.total}
                </span>
              )}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Non classé</span>
          )}
        </div>
      </div>

      {/* ── Positions ─────────────────────────────────────────── */}
      <div className="flex-1 px-4 py-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Mes positions
        </h3>

        {!hasPortfolio || positions.length === 0 ? (
          /* ── Empty state ─────────────────────────────────── */
          <Card className="bg-card border-border border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Wallet className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-foreground">Aucune position</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configurez votre portfolio lors de la prochaine fenêtre d&apos;arbitrage
                  (sam. 8h – dim. 21h).
                </p>
              </div>
              {arbitrage.isOpen && (
                <Link href="/arbitrage">
                  <Button size="sm" className="mt-1 bg-primary text-primary-foreground">
                    Configurer maintenant
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          /* ── Liste des positions ──────────────────────────── */
          <div className="flex flex-col gap-2">
            {positions.map((pos) => {
              const positive = (pos.variation_day ?? 0) >= 0
              return (
                <Card key={pos.ticker} className="bg-card border-border">
                  <CardContent className="flex items-center justify-between p-3">
                    {/* Gauche : logo + infos */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                        {pos.ticker.slice(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground leading-tight">
                          {pos.ticker}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pos.allocation_pct}%
                        </span>
                      </div>
                    </div>

                    {/* Droite : sparkline + prix + variation */}
                    <div className="flex items-center gap-3">
                      {pos.sparkline.length >= 2 && (
                        <MiniSparkline
                          data={pos.sparkline}
                          positive={positive}
                        />
                      )}
                      <div className="flex flex-col items-end">
                        <span className="font-medium tabular-nums text-foreground">
                          {pos.prix_actuel != null
                            ? `$${pos.prix_actuel.toFixed(2)}`
                            : "—"}
                        </span>
                        <span
                          className={`text-xs font-medium tabular-nums ${
                            pos.variation_day === null
                              ? "text-muted-foreground"
                              : positive
                                ? "text-success"
                                : "text-danger"
                          }`}
                        >
                          {pos.variation_day === null
                            ? "—"
                            : fmtPerf(pos.variation_day)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
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
