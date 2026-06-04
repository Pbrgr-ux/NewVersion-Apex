"use client"

import Link from "next/link"
import {
  TrendingUp, TrendingDown, Clock, Trophy,
  Lock, Wallet, Star, ChevronRight, Zap, Globe,
  Medal, Users,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button }            from "@/components/ui/button"
import { useArbitrageWindow } from "@/hooks/use-arbitrage-window"
import type { DashboardData, LeaderRow } from "@/lib/dashboard-data"

// Ligne de classement compacte (top 3 + moi)
function LeaderLine({ r }: { r: LeaderRow }) {
  const medal = r.rang === 1 ? "bg-amber-400 text-black" : r.rang === 2 ? "bg-slate-300 text-black" : r.rang === 3 ? "bg-orange-500 text-white" : "bg-secondary text-muted-foreground"
  return (
    <div className={`flex items-center gap-2.5 rounded-lg px-2 py-1 ${r.isSelf ? "bg-primary/10 border border-primary/30" : ""}`}>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${medal}`}>{r.rang}</span>
      <span className={`flex-1 truncate text-sm ${r.isSelf ? "font-bold text-primary" : "font-medium text-foreground"}`}>
        {r.pseudo}{r.isSelf && <span className="ml-1 text-xs font-normal opacity-60">(you)</span>}
      </span>
      <span className={`text-sm font-bold tabular-nums ${r.perf >= 0 ? "text-green-500" : "text-red-500"}`}>
        {r.perf >= 0 ? "+" : ""}{r.perf.toFixed(1)}%
      </span>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
function fmtPerf(v: number | null, placeholder = "—"): string {
  if (v === null) return placeholder
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
}

// Une seule décimale (cartes de performance)
function fmtPerf1(v: number | null, placeholder = "—"): string {
  if (v === null) return placeholder
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
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
  const { perf, positions, classement, hasPortfolio, season, capitalAjuste, allTime, indices, leaderboard, tradingStats } = data

  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">

      {/* ── HERO : titre saison + rang + capital + perf ──────── */}
      <div className="mx-4 mt-2 mb-3 rounded-2xl border border-border bg-card p-4">

        {/* Titre saison (en tête du container) */}
        <div className="mb-4 pb-3 border-b border-border/60">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground uppercase">{season.label}</h1>
            {season.statut === "active" && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {season.statut === "active" ? `Week ${season.semaine} / ${season.semainesTotal}`
               : season.statut === "a_venir" ? "Upcoming" : "Ended"}
            </span>
            {season.statut === "active" && (
              <span className="flex items-center gap-1 text-green-500">
                <Users className="h-3.5 w-3.5" />
                {season.semainesRestantes} weeks left
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">

          {/* Colonne gauche : médaille + rang + écart + semaines */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                classement.rang === 1 ? "bg-amber-400 text-black" :
                classement.rang === 2 ? "bg-slate-300 text-black" :
                classement.rang === 3 ? "bg-orange-500 text-white" :
                "bg-secondary text-muted-foreground"
              }`}>
                {classement.rang != null ? <Medal className="h-6 w-6" /> : "—"}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rank</p>
                <p className="text-lg font-bold leading-tight text-foreground">
                  {classement.rang != null ? `#${classement.rang}` : "—"}
                  {classement.total > 0 && (
                    <span className="text-sm font-normal text-muted-foreground"> /{classement.total}</span>
                  )}
                </p>
              </div>
            </div>

            {leaderboard.toPass && leaderboard.toPass.delta > 0 && (
              <p className="mt-3 text-sm text-foreground">
                You&apos;re <span className="font-bold text-amber-500">+{leaderboard.toPass.delta}%</span> from {leaderboard.toPass.pseudo}
              </p>
            )}
          </div>

          {/* Colonne droite : capital + season perf (alignés à gauche) + barre */}
          <div className="flex flex-col">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Capital</p>
            <p className="text-lg font-bold leading-tight text-foreground tabular-nums">
              {capitalAjuste ? `${fmtPrix(capitalAjuste)} €` : "—"}
            </p>

            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Season perf</p>
            <p className={`text-lg font-bold leading-tight tabular-nums ${perfColor(perf.season)}`}>
              {fmtPerf1(perf.season)}
            </p>

            {season.statut === "active" && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(season.semaine / season.semainesTotal) * 100}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Perfs secondaires (Today / Week / Ever) ──────────── */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-3">
        {([
          { label: "Today",     value: perf.day,  icon: <TrendingUp className="h-3 w-3" /> },
          { label: "This week", value: perf.week, icon: null },
          { label: "Ever",      value: allTime?.perf_totale_cumulee ?? null, icon: <Star className="h-3 w-3" /> },
        ] as const).map(({ label, value, icon }) => (
          <div key={label} className="flex flex-col items-center rounded-lg bg-secondary/30 px-2 py-1.5">
            <div className="flex items-center justify-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {icon && <span className={perfColor(value)}>{icon}</span>}
              <span className="truncate">{label}</span>
            </div>
            <span className={`text-sm font-bold tabular-nums leading-tight ${perfColor(value)}`}>
              {fmtPerf1(value)}
            </span>
          </div>
        ))}
      </div>

      {/* ── Classement (top 3 + moi + écart) ─────────────────── */}
      {leaderboard.top.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ranking</span>
            <Link href="/classement" className="flex items-center gap-0.5 text-xs font-semibold text-primary">
              See ranking <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex flex-col gap-1.5">
            {leaderboard.top.map((r) => (
              <LeaderLine key={r.rang} r={r} />
            ))}
            {leaderboard.self && (
              <>
                <div className="text-center text-xs text-muted-foreground">···</div>
                <LeaderLine r={leaderboard.self} />
              </>
            )}
          </div>

          {leaderboard.toPass && leaderboard.toPass.delta > 0 && (
            <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-foreground">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              <span>
                <span className="font-bold text-primary">+{leaderboard.toPass.delta}%</span> to pass {leaderboard.toPass.pseudo}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Bandeau statut fenêtre d'arbitrage ───────────────── */}
      <Link href="/arbitrage" className="mx-4 mb-3">
        <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
          arbitrage.isOpen
            ? "border-green-500/30 bg-green-500/10"
            : "border-border bg-card"
        }`}>
          <div className="flex items-center gap-2">
            <Clock className={`h-4 w-4 ${arbitrage.isOpen ? "text-green-500" : "text-muted-foreground"}`} />
            <span className={`text-sm font-semibold ${arbitrage.isOpen ? "text-green-500" : "text-foreground"}`}>
              {arbitrage.isOpen ? "Window open" : "Window closed"}
            </span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {arbitrage.isOpen
              ? <>Closes in <span className="font-semibold text-green-500">{arbitrage.timeUntilClose}</span></>
              : <>Opens in <span className="font-semibold text-foreground">{arbitrage.timeUntilOpen}</span></>}
          </span>
        </div>
      </Link>

      {/* ── Indices marché ───────────────────────────────────── */}
      {/* Masqué pour l'instant — le feed continue d'alimenter `indices`,
          réactiver en retirant le `false &&` ci-dessous */}
      {false && (indices.cac40_variation !== null || indices.sp500_variation !== null) && (
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

      {/* ── Positions ─────────────────────────────────────────── */}
      <div className="px-4 pb-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          My positions
        </h3>

        {!hasPortfolio || positions.length === 0 ? (
          /* ── Onboarding nouveau joueur ── */
          <div className="rounded-2xl border border-border bg-card px-4 py-5">
            <p className="text-base font-bold text-foreground">Welcome to TradeLeague 👋</p>
            <p className="text-sm text-muted-foreground mt-0.5 mb-4">
              Build your portfolio, beat your rivals.
            </p>

            <div className="flex flex-col gap-3 mb-5">
              {([
                { n: "1", icon: <Wallet className="h-4 w-4" />,    title: "Pick your stocks",  desc: "During the weekly window, split your capital across up to 65 stocks." },
                { n: "2", icon: <TrendingUp className="h-4 w-4" />, title: "Real markets",      desc: "Live prices. Your performance tracks the real market." },
                { n: "3", icon: <Trophy className="h-4 w-4" />,     title: "Climb the ranking", desc: "13-week seasons. Compete against everyone." },
              ] as const).map((step) => (
                <div key={step.n} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {arbitrage.isOpen ? (
              <Link href="/arbitrage">
                <Button className="w-full h-11 font-semibold">Build my portfolio →</Button>
              </Link>
            ) : (
              <Button className="w-full h-11 font-semibold bg-secondary text-secondary-foreground cursor-not-allowed" disabled>
                <Lock className="h-4 w-4 mr-2" /> Opens in {arbitrage.timeUntilOpen}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {positions.map((pos) => {
              const positive = (pos.variation_day ?? 0) >= 0
              return (
                <Link key={pos.ticker} href={`/stock/${encodeURIComponent(pos.ticker)}`}>
                <Card className="bg-card border-border py-0 gap-0 transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                        {pos.ticker.replace(".", "").slice(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground leading-tight">{pos.ticker}</span>
                        <span className="text-xs text-muted-foreground">{pos.allocation_pct}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Prix acquisition → prix actuel */}
                      <div className="flex flex-col items-end leading-tight">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          Acq {pos.open_price != null ? pos.open_price.toFixed(2) : "—"}
                        </span>
                        <span className="text-sm font-medium tabular-nums text-foreground">
                          {pos.prix_actuel != null ? pos.prix_actuel.toFixed(2) : "—"}
                        </span>
                      </div>
                      {/* Plus-value latente : % et € */}
                      <div className="flex flex-col items-end leading-tight w-20">
                        <span className={`text-sm font-bold tabular-nums ${
                          pos.variation_day === null ? "text-muted-foreground" : positive ? "text-green-500" : "text-red-500"
                        }`}>
                          {pos.variation_day === null ? "—" : fmtPerf(pos.variation_day)}
                        </span>
                        <span className={`text-xs font-medium tabular-nums ${
                          pos.pnl_eur === null ? "text-muted-foreground" : positive ? "text-green-500" : "text-red-500"
                        }`}>
                          {pos.pnl_eur === null ? "—" : `${pos.pnl_eur >= 0 ? "+" : ""}${fmtPrix(pos.pnl_eur)} €`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Stats de trading (sous les positions) ────────────── */}
      {tradingStats && tradingStats.tradesCount > 0 && (
        <div className="mx-4 mb-3 grid grid-cols-4 gap-2">
          {([
            { label: "Best",     value: tradingStats.bestTrade  != null ? fmtPerf1(tradingStats.bestTrade)  : "—", color: "text-green-500" },
            { label: "Worst",    value: tradingStats.worstTrade != null ? fmtPerf1(tradingStats.worstTrade) : "—", color: "text-red-500" },
            { label: "Win rate", value: tradingStats.winRate    != null ? `${tradingStats.winRate}%` : "—",       color: "text-foreground" },
            { label: "Trades",   value: `${tradingStats.tradesCount}`,                                            color: "text-foreground" },
          ] as const).map((s) => (
            <div key={s.label} className="flex flex-col items-center rounded-lg bg-secondary/30 px-1 py-1.5">
              <span className="text-xs text-muted-foreground text-center leading-tight">{s.label}</span>
              <span className={`text-sm font-bold tabular-nums ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Bouton arbitrage ─────────────────────────────────── */}
      <div className="px-4 pb-4">
        {arbitrage.isOpen ? (
          <Link href="/arbitrage">
            <Button className="w-full h-12 text-sm font-semibold bg-green-600 text-white hover:bg-green-600/90">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Trading window</span>
                <span className="font-normal opacity-90">· Closes in {arbitrage.timeUntilClose}</span>
              </div>
            </Button>
          </Link>
        ) : (
          <Button className="w-full h-12 text-sm font-semibold bg-secondary text-secondary-foreground cursor-not-allowed" disabled>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Window closed</span>
              <span className="font-mono font-normal opacity-75">· Opens in {arbitrage.timeUntilOpen}</span>
            </div>
          </Button>
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
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Seasons played</span>
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
    </main>
  )
}
