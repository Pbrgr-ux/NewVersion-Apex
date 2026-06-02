"use client"

import Link from "next/link"
import {
  TrendingUp, TrendingDown, Clock, Trophy,
  BarChart3, User, Home, Lock, Wallet,
  Star, Zap, Globe,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button }            from "@/components/ui/button"
import { MiniSparkline }     from "@/components/mini-sparkline"
import { useArbitrageWindow } from "@/hooks/use-arbitrage-window"
import type { DashboardData } from "@/lib/dashboard-data"

// ── Helpers ───────────────────────────────────────────────────
function fmtPerf(v: number | null, placeholder = "—"): string {
  if (v === null) return placeholder
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
}

function fmtPrix(v: number | null): string {
  if (v === null) return "—"
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function perfColor(v: number | null): string {
  if (v === null) return "text-muted-foreground"
  return v >= 0 ? "text-green-500" : "text-red-500"
}

// ── Composant ─────────────────────────────────────────────────
export function DashboardScreen({ data }: { data: DashboardData }) {
  const arbitrage = useArbitrageWindow()
  const { perf, positions, classement, hasPortfolio, season, capitalAjuste, allTime, indices } = data

  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">

      {/* ── Saison en cours ──────────────────────────────────── */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {season.label}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            season.statut === "active"   ? "bg-green-500/15 text-green-500" :
            season.statut === "a_venir" ? "bg-primary/15 text-primary" :
            "bg-secondary text-muted-foreground"
          }`}>
            {season.statut === "active"   ? `Sem. ${season.semaine}/13` :
             season.statut === "a_venir" ? "À venir" : "Terminée"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Perf. saison</p>
            <p className={`text-sm font-bold tabular-nums ${perfColor(perf.season)}`}>
              {fmtPerf(perf.season)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Classement</p>
            <p className="text-sm font-bold text-foreground">
              {classement.rang != null ? `#${classement.rang}` : "—"}
              {classement.total > 0 && (
                <span className="text-xs font-normal text-muted-foreground">/{classement.total}</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Capital</p>
            <p className="text-sm font-bold text-foreground">
              {capitalAjuste ? `${fmtPrix(capitalAjuste)} €` : "—"}
            </p>
          </div>
        </div>
        {/* Semaines restantes */}
        {season.statut === "active" && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Semaines restantes : {season.semainesRestantes}</span>
              <span>{season.semaine}/{season.semainesTotal}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(season.semaine / season.semainesTotal) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Perfs : Jour / Hebdo / Saison / Ever ────────────── */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-3">
        {([
          { label: "Aujourd'hui", value: perf.day,    icon: <TrendingUp className="h-3.5 w-3.5" /> },
          { label: "Cette semaine", value: perf.week,   icon: null },
          { label: season.label,  value: perf.season, icon: null },
          { label: "Ever",        value: allTime?.perf_totale_cumulee ?? null, icon: <Star className="h-3.5 w-3.5" /> },
        ] as const).map(({ label, value, icon }) => {
          const pos = (value ?? 0) >= 0
          return (
            <Card key={label} className="bg-card border-border py-0 gap-0">
              <CardContent className="flex flex-col gap-0 px-3 py-1.5">
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {icon && <span className={perfColor(value)}>{icon}</span>}
                  <span className="truncate">{label}</span>
                </div>
                <span className={`text-base font-bold tabular-nums leading-tight ${perfColor(value)}`}>
                  {fmtPerf(value)}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Indices marché ───────────────────────────────────── */}
      {(indices.cac40_variation !== null || indices.sp500_variation !== null) && (
        <div className="mx-4 mb-3 flex gap-2">
          <Card className="flex-1 bg-card border-border">
            <CardContent className="flex flex-col items-center py-2 px-3">
              <span className="text-xs text-muted-foreground font-medium">CAC 40</span>
              <span className={`text-sm font-bold tabular-nums ${perfColor(indices.cac40_variation)}`}>
                {fmtPerf(indices.cac40_variation)}
              </span>
              {indices.cac40_prix && (
                <span className="text-xs text-muted-foreground">{fmtPrix(indices.cac40_prix)}</span>
              )}
            </CardContent>
          </Card>
          <Card className="flex-1 bg-card border-border">
            <CardContent className="flex flex-col items-center py-2 px-3">
              <span className="text-xs text-muted-foreground font-medium">S&P 500</span>
              <span className={`text-sm font-bold tabular-nums ${perfColor(indices.sp500_variation)}`}>
                {fmtPerf(indices.sp500_variation)}
              </span>
              {indices.sp500_prix && (
                <span className="text-xs text-muted-foreground">{fmtPrix(indices.sp500_prix)}</span>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Bouton arbitrage ─────────────────────────────────── */}
      <div className="px-4 pb-3">
        {arbitrage.isOpen ? (
          <Link href="/arbitrage">
            <Button size="lg" className="w-full h-16 text-lg font-semibold bg-green-600 text-white hover:bg-green-600/90">
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
          <Button size="lg" className="w-full h-14 font-semibold bg-secondary text-secondary-foreground cursor-not-allowed" disabled>
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

      {/* ── Positions ─────────────────────────────────────────── */}
      <div className="flex-1 px-4 pb-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Mes positions
        </h3>

        {!hasPortfolio || positions.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Wallet className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium text-foreground">Aucune position</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configurez votre portfolio lors de la prochaine fenêtre d&apos;arbitrage.
                </p>
              </div>
              {arbitrage.isOpen && (
                <Link href="/arbitrage">
                  <Button size="sm" className="mt-1">Configurer maintenant</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {positions.map((pos) => {
              const positive = (pos.variation_day ?? 0) >= 0
              return (
                <Card key={pos.ticker} className="bg-card border-border">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                        {pos.ticker.replace(".", "").slice(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground leading-tight">{pos.ticker}</span>
                        <span className="text-xs text-muted-foreground">{pos.allocation_pct}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {pos.sparkline.length >= 2 && (
                        <MiniSparkline data={pos.sparkline} positive={positive} />
                      )}
                      <div className="flex flex-col items-end">
                        <span className="font-medium tabular-nums text-foreground">
                          {pos.prix_actuel != null ? pos.prix_actuel.toFixed(2) : "—"}
                        </span>
                        <span className={`text-xs font-medium tabular-nums ${
                          pos.variation_day === null ? "text-muted-foreground" : positive ? "text-green-500" : "text-red-500"
                        }`}>
                          {pos.variation_day === null ? "—" : fmtPerf(pos.variation_day)}
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

      {/* ── All-Time ─────────────────────────────────────────── */}
      {allTime && allTime.nb_saisons > 0 && (
        <div className="px-4 pb-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            All-Time
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col gap-0.5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Alpha moyen</span>
                </div>
                <span className={`text-lg font-bold tabular-nums ${perfColor(allTime.alpha_moyen)}`}>
                  {fmtPerf(allTime.alpha_moyen)} <span className="text-xs font-normal text-muted-foreground">/saison</span>
                </span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col gap-0.5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Trophy className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Meilleur rang</span>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {allTime.meilleur_rang ? `#${allTime.meilleur_rang}` : "—"}
                  {allTime.meilleur_rang_saison && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">({allTime.meilleur_rang_saison})</span>
                  )}
                </span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col gap-0.5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Saisons jouées</span>
                </div>
                <span className="text-lg font-bold text-foreground">{allTime.nb_saisons}</span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col gap-0.5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Win rate</span>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {allTime.win_rate != null ? `${allTime.win_rate}%` : "—"}
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center justify-around py-2">
          <Link href="/dashboard"  className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <Home      className="h-5 w-5" /><span className="text-xs font-medium">Dashboard</span>
          </Link>
          <Link href="/classement" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <BarChart3 className="h-5 w-5" /><span className="text-xs font-medium">Classement</span>
          </Link>
          <Link href="/profil"     className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <User      className="h-5 w-5" /><span className="text-xs font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    </main>
  )
}
