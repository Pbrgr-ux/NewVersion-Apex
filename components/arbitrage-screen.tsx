"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Clock,
  Lock,
  Minus,
  Plus,
  AlertTriangle,
  Trophy,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent }       from "@/components/ui/card"
import { Button }                  from "@/components/ui/button"
import { Slider }                  from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useArbitrageWindow }      from "@/hooks/use-arbitrage-window"
import { MAIN_WINDOW, type ArbitrageWindowConfig } from "@/lib/arbitrage-window"
import { TICKERS }                 from "@/lib/tickers"
import { createClient }            from "@/lib/supabase/client"
import { getCurrentSeasonId }      from "@/lib/seasons"
import type { LeagueContext }      from "@/lib/leagues"

// Saison courante — doit correspondre à celle lue par le dashboard
const CURRENT_SAISON = getCurrentSeasonId()
// Clé localStorage par utilisateur ET par contexte (jeu principal / ligue)
function lsKey(userId: string, ctx: string) { return `tl_lock_close_${userId}_${ctx}` }

type Region = "US" | "Europe" | "ETF"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function windowLabel(cfg: ArbitrageWindowConfig): string {
  const days = (cfg.jours ?? []).slice().sort((a, b) => a - b).map((d) => DAY_LABELS[d]).join(", ")
  return `${days || "—"} · ${cfg.heureDebut}:00–${cfg.heureFin}:00`
}

// ── Mock prix (fallback si live indispo) ──────────────────────
const MOCK_MARKET: Record<string, { price: number; weekChange: number }> = {
  AAPL:  { price: 189.30, weekChange:  1.84 }, MSFT:  { price: 415.20, weekChange:  0.92 },
  NVDA:  { price: 875.40, weekChange:  4.67 }, GOOGL: { price: 175.60, weekChange: -1.05 },
  AMZN:  { price: 192.10, weekChange:  2.31 }, META:  { price: 527.80, weekChange:  3.22 },
  "BRK.B":{ price: 412.50, weekChange:  0.54 }, TSLA: { price: 172.30, weekChange: -2.10 },
  AVGO:  { price: 1342.0, weekChange:  2.08 }, JPM:   { price: 208.90, weekChange:  1.12 },
  LLY:   { price: 798.50, weekChange: -0.76 }, V:     { price: 285.40, weekChange:  0.47 },
  XOM:   { price: 119.70, weekChange:  0.33 }, UNH:   { price: 495.20, weekChange: -0.14 },
  JNJ:   { price: 147.60, weekChange: -0.38 }, WMT:   { price: 68.40,  weekChange:  0.89 },
  MA:    { price: 478.30, weekChange:  0.63 }, PG:    { price: 165.10, weekChange:  0.21 },
  ORCL:  { price: 127.80, weekChange:  1.72 }, HD:    { price: 358.90, weekChange:  0.37 },
  COST:  { price: 824.60, weekChange:  1.56 }, BAC:   { price: 40.20,  weekChange:  0.81 },
  NFLX:  { price: 628.40, weekChange:  2.45 }, CVX:   { price: 162.30, weekChange: -0.55 },
  CRM:   { price: 285.10, weekChange:  1.94 },
  MC:    { price: 642.00, weekChange: -1.20 }, NESN:  { price: 94.50,  weekChange:  0.32 },
  ASML:  { price: 788.00, weekChange:  2.11 }, "NOVO-B":{ price: 826.00, weekChange: -3.40 },
  ROG:   { price: 245.30, weekChange: -0.68 }, SAP:   { price: 196.40, weekChange:  1.45 },
  NOVN:  { price: 98.20,  weekChange:  0.14 }, AZN:   { price: 2156.0, weekChange:  0.87 },
  RMS:   { price: 2180.0, weekChange: -0.92 }, SHEL:  { price: 2712.0, weekChange:  0.44 },
  TTE:   { price: 61.40,  weekChange:  0.28 }, SIE:   { price: 187.60, weekChange:  1.03 },
  SU:    { price: 235.80, weekChange:  0.76 }, OR:    { price: 378.50, weekChange: -0.51 },
  SAN:   { price: 98.70,  weekChange: -0.33 }, ULVR:  { price: 3924.0, weekChange:  0.62 },
  HSBA:  { price: 712.00, weekChange:  0.19 }, AIR:   { price: 172.40, weekChange:  1.88 },
  ALV:   { price: 298.50, weekChange:  0.54 }, ITX:   { price: 48.30,  weekChange:  0.97 },
  IBE:   { price: 12.84,  weekChange:  0.41 }, ABBN:  { price: 50.60,  weekChange:  0.73 },
  BNP:   { price: 69.40,  weekChange: -0.28 }, CFR:   { price: 124.50, weekChange: -1.14 },
  MUV2:  { price: 418.70, weekChange:  0.85 },
  SPY:   { price: 524.10, weekChange:  1.42 }, IVV:   { price: 527.80, weekChange:  1.38 },
  VOO:   { price: 483.40, weekChange:  1.39 }, QQQ:   { price: 448.20, weekChange:  2.17 },
  VTI:   { price: 254.60, weekChange:  1.31 }, SOXX:  { price: 214.30, weekChange:  3.85 },
  XLF:   { price: 43.70,  weekChange:  0.94 }, XLV:   { price: 140.20, weekChange: -0.22 },
  VGK:   { price: 68.40,  weekChange:  0.88 }, URTH:  { price: 112.60, weekChange:  1.15 },
  IEMG:  { price: 51.30,  weekChange:  0.63 }, LCUW:  { price: 489.40, weekChange:  1.22 },
  "500": { price: 34.18,  weekChange:  1.35 }, BND:   { price: 73.20,  weekChange: -0.08 },
  IAU:   { price: 40.80,  weekChange:  2.94 },
}

const TABS: { label: string; region: Region }[] = [
  { label: "🇺🇸 US",     region: "US"     },
  { label: "🇪🇺 Europe", region: "Europe" },
  { label: "📦 ETF",    region: "ETF"    },
]

export function ArbitrageScreen({ leagueContexts = [], initialLeagueId = null, mainWindow = MAIN_WINDOW }: { leagueContexts?: LeagueContext[]; initialLeagueId?: string | null; mainWindow?: ArbitrageWindowConfig }) {
  const supabase  = createClient()
  const router    = useRouter()

  // ── Contexte de compétition (null = jeu principal) ─────────
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(initialLeagueId)
  const activeLeague = useMemo(
    () => leagueContexts.find((l) => l.id === activeLeagueId) ?? null,
    [leagueContexts, activeLeagueId]
  )
  const ctxKey = activeLeagueId ?? "main"

  // Config dérivée du contexte
  const windowConfig: ArbitrageWindowConfig = useMemo(() => activeLeague
    ? { jours: activeLeague.fenetre_jours, heureDebut: activeLeague.fenetre_heure_debut, heureFin: activeLeague.fenetre_heure_fin }
    : mainWindow,
    [activeLeague, mainWindow])
  const maxAlloc = activeLeague?.max_allocation_pct ?? 50
  const universe = useMemo(() => {
    const allowed = activeLeague?.tickers_autorises
    if (!allowed || allowed.length === 0) return TICKERS
    const set = new Set(allowed)
    return TICKERS.filter((t) => set.has(t.ticker))
  }, [activeLeague])

  const arbitrage = useArbitrageWindow(windowConfig)

  const [activeTab, setActiveTab]     = useState<Region>("US")
  const [isLocked, setIsLocked]       = useState(false)
  const [userId, setUserId]           = useState<string | null>(null)
  const [sortVersion, setSortVersion] = useState(0)

  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    TICKERS.forEach((t) => { init[t.ticker] = 0 })
    return init
  })
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting]           = useState(false)
  const [submitError, setSubmitError]             = useState<string | null>(null)
  const [livePrices, setLivePrices]               = useState<Record<string, number>>({})
  const [capitalAjuste, setCapitalAjuste]         = useState(100_000)
  const [openPosWealth, setOpenPosWealth]         = useState<Array<{ ticker: string; base_capital: number | null; open_price: number | null; allocation_pct: number }>>([])

  // Onglets visibles = régions présentes dans l'univers du contexte
  const visibleTabs = useMemo(
    () => TABS.filter((tab) => universe.some((t) => t.region === tab.region)),
    [universe]
  )
  // S'assurer que l'onglet actif est valide pour l'univers courant
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((t) => t.region === activeTab)) {
      setActiveTab(visibleTabs[0].region)
    }
  }, [visibleTabs, activeTab])

  // ── Prix temps réel ────────────────────────────────────────
  useEffect(() => {
    fetch("/api/quotes")
      .then((r) => r.json())
      .then((d) => { if (d?.quotes) setLivePrices(d.quotes) })
      .catch(() => {})
  }, [])

  // ── Capital courant = valeur réelle du portefeuille ────────
  const currentCapital = useMemo(() => {
    if (openPosWealth.length === 0) return capitalAjuste
    const base = openPosWealth[0].base_capital ?? capitalAjuste
    let r = 0
    for (const p of openPosWealth) {
      const live = livePrices[p.ticker]
      const open = p.open_price
      if (live != null && open && open > 0) {
        const ratio = live / open
        if (ratio <= 10 && ratio >= 0.1) r += (p.allocation_pct / 100) * (ratio - 1)
      }
    }
    return Math.round(base * (1 + r))
  }, [openPosWealth, livePrices, capitalAjuste])

  // ── Charger l'allocation du contexte + vérifier le lock ────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Reset au changement de contexte
      setAllocations(() => {
        const z: Record<string, number> = {}
        TICKERS.forEach((t) => { z[t.ticker] = 0 })
        return z
      })
      setOpenPosWealth([])
      setIsLocked(false)

      // 1. Portfolio du contexte courant
      let pq = supabase
        .from("portfolios")
        .select("id, capital_ajuste")
        .eq("user_id", user.id)
      pq = activeLeagueId
        ? pq.eq("league_id", activeLeagueId)
        : pq.eq("saison", CURRENT_SAISON).is("league_id", null)
      const { data: portfolios } = await pq.order("id", { ascending: false }).limit(1)

      const portfolioId = portfolios?.[0]?.id
      const capBase = portfolios?.[0]?.capital_ajuste != null
        ? Number(portfolios[0].capital_ajuste)
        : (activeLeague?.capital_initial ?? 100_000)
      setCapitalAjuste(capBase)
      let hasPositions = false

      if (portfolioId) {
        const { data: positions } = await supabase
          .from("positions")
          .select("ticker, allocation_pct, base_capital, open_price")
          .eq("portfolio_id", portfolioId)
          .eq("status", "open")

        if (positions && positions.length > 0) {
          hasPositions = true
          setAllocations((prev) => {
            const next = { ...prev }
            for (const p of positions) next[p.ticker] = Number(p.allocation_pct)
            return next
          })
          setOpenPosWealth(positions.map((p) => ({
            ticker:         p.ticker,
            base_capital:   p.base_capital != null ? Number(p.base_capital) : null,
            open_price:     p.open_price != null ? Number(p.open_price) : null,
            allocation_pct: Number(p.allocation_pct),
          })))
          setSortVersion((v) => v + 1)
        }
      }

      // 2. Lock localStorage (par contexte)
      const lockedUntil = localStorage.getItem(lsKey(user.id, ctxKey))
      const lockActif   = lockedUntil != null && Date.now() < new Date(lockedUntil).getTime()
      if (lockActif && hasPositions) setIsLocked(true)
      else localStorage.removeItem(lsKey(user.id, ctxKey))
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, activeLeagueId])

  // Tri : tickers alloués en tête (univers du contexte)
  const visibleStocks = useMemo(
    () => {
      const inTab = universe.filter((t) => t.region === activeTab)
      return [...inTab].sort((a, b) => {
        const aOn = (allocations[a.ticker] ?? 0) > 0 ? 1 : 0
        const bOn = (allocations[b.ticker] ?? 0) > 0 ? 1 : 0
        return bOn - aOn
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab, sortVersion, universe]
  )

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
      const maxForThis = Math.min(maxAlloc, 100 - otherSum)
      return { ...prev, [ticker]: Math.max(0, Math.min(maxForThis, value)) }
    })
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/arbitrate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ allocations, leagueId: activeLeagueId ?? undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? "Could not save")

      const { data: { user } } = await supabase.auth.getUser()
      if (user && arbitrage.windowCloseISO) {
        localStorage.setItem(lsKey(user.id, ctxKey), arbitrage.windowCloseISO)
        setUserId(user.id)
      }
      setShowConfirmDialog(false)
      router.push(activeLeagueId ? `/ligue/${activeLeagueId}` : "/dashboard")
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Positions soumises (pour l'écran verrouillé) ────────────
  const submittedPositions = useMemo(
    () => TICKERS
      .filter((t) => (allocations[t.ticker] ?? 0) > 0)
      .sort((a, b) => (allocations[b.ticker] ?? 0) - (allocations[a.ticker] ?? 0)),
    [allocations]
  )

  // ── Sélecteur de contexte (réutilisé dans les deux écrans) ──
  const ContextSelector = leagueContexts.length > 0 ? (
    <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-2">
      <Trophy className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-xs text-muted-foreground">Trading for</span>
      <div className="relative flex-1">
        <select
          value={activeLeagueId ?? "main"}
          onChange={(e) => setActiveLeagueId(e.target.value === "main" ? null : e.target.value)}
          className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-1.5 pr-8 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="main">Main game</option>
          {leagueContexts.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  ) : null

  // ── Écran verrouillé ─────────────────────────────────────────
  if (isLocked) {
    return (
      <main className="flex min-h-svh flex-col bg-background pb-20">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 ${arbitrage.isOpen ? "text-green-500" : "text-muted-foreground"}`} />
              <span className="font-semibold text-foreground">
                {arbitrage.isOpen ? "Window open" : "Window closed"}
              </span>
            </div>
            <span className="font-mono text-sm text-muted-foreground">
              {arbitrage.isOpen
                ? <span>Closes in <span className="font-semibold text-green-500">{arbitrage.timeUntilClose}</span></span>
                : <span>Opens in <span className="font-semibold">{arbitrage.timeUntilOpen}</span></span>
              }
            </span>
          </div>
        </header>

        {ContextSelector}

        <div className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 mt-0.5">
            <Lock className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-500">Portfolio submitted</p>
            <p className="text-xs text-muted-foreground">
              {arbitrage.isOpen
                ? "Cannot be changed until the window closes."
                : "Editable during the next trading window."}
            </p>
          </div>
          {arbitrage.isOpen && userId && (
            <button
              onClick={() => { localStorage.removeItem(lsKey(userId, ctxKey)); setIsLocked(false) }}
              className="shrink-0 rounded-lg border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Modify
            </button>
          )}
        </div>

        <div className="px-4 py-4 space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Submitted allocation
          </h3>

          {submittedPositions.map((t) => {
            const pct = allocations[t.ticker] ?? 0
            return (
              <div key={t.ticker} className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-foreground">
                  {t.ticker.replace(".", "").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="font-semibold text-foreground text-sm">{t.ticker}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{t.name}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(pct / maxAlloc) * 100}%` }} />
                  </div>
                </div>
              </div>
            )
          })}

          {cashPct > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-card border border-green-500/20 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/15 text-sm">💵</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-green-500 text-sm">Cash</span>
                  <span className="text-sm font-bold text-green-500 tabular-nums">{cashPct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-green-500/60" style={{ width: `${cashPct}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh flex-col bg-background pb-36">

      {/* ── Header statut fenêtre ──────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${arbitrage.isOpen ? "text-success" : "text-danger"}`} />
            <span className="font-semibold text-foreground">
              {arbitrage.isOpen ? "Window open" : "Window closed"}
            </span>
          </div>
          <span className="font-mono text-sm text-muted-foreground">
            {arbitrage.isOpen ? (
              <>Closes in <span className="font-semibold text-success">{arbitrage.timeUntilClose}</span></>
            ) : (
              <>Opens in <span className="font-semibold text-foreground">{arbitrage.timeUntilOpen}</span></>
            )}
          </span>
        </div>

        {!arbitrage.isOpen && (
          <div className="flex items-center gap-2 border-t border-border/60 bg-secondary/60 px-4 py-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Open <span className="font-medium text-foreground">{windowLabel(windowConfig)}</span> (Paris time).
            </p>
          </div>
        )}
      </header>

      {ContextSelector}

      {/* ── Solde ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 px-4 py-6 border-b border-border">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {activeLeague ? `${activeLeague.name} · capital` : "Available capital"}
        </span>
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {currentCapital.toLocaleString("en-US")} €
        </span>
      </div>

      {/* ── Onglets ───────────────────────────────────────────── */}
      {visibleTabs.length > 1 && (
        <div className="sticky top-[57px] z-30 border-b border-border bg-background px-4 py-2">
          <div className="flex gap-2">
            {visibleTabs.map((tab) => {
              const tabTotal = universe
                .filter((t) => t.region === tab.region)
                .reduce((s, t) => s + (allocations[t.ticker] ?? 0), 0)
              return (
                <button
                  key={tab.region}
                  onClick={() => setActiveTab(tab.region)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    activeTab === tab.region
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {tabTotal > 0 && (
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                      activeTab === tab.region ? "bg-white/20" : "bg-primary/15 text-primary"
                    }`}>
                      {tabTotal}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Liste des actions ──────────────────────────────────── */}
      <div className="flex-1 px-4 py-4">
        <div className="mb-3 flex items-center justify-end">
          <span className="text-xs text-muted-foreground">Max {maxAlloc}% per stock</span>
        </div>

        <div className="flex flex-col gap-2">
          {visibleStocks.map((stock) => {
            const mock   = MOCK_MARKET[stock.ticker] ?? { price: 100, weekChange: 0 }
            const price  = livePrices[stock.ticker] ?? mock.price
            const alloc  = allocations[stock.ticker] ?? 0
            return (
              <Card
                key={stock.ticker}
                className={`border-border overflow-hidden transition-opacity py-0 gap-0 ${
                  arbitrage.isOpen ? "bg-card" : "bg-card opacity-60"
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-xs font-bold text-foreground">
                        {stock.ticker.replace(".", "").slice(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <Link href={`/stock/${encodeURIComponent(stock.ticker)}`} className="text-sm font-semibold text-foreground leading-tight hover:text-primary hover:underline">
                          {stock.ticker}
                        </Link>
                        <span className="text-xs text-muted-foreground leading-tight">{stock.name}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium tabular-nums text-foreground">
                        {price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1 bg-secondary/30">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => updateAllocation(stock.ticker, alloc - 5)}
                      disabled={!arbitrage.isOpen || alloc === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <div className="flex flex-1 items-center gap-2">
                      <Slider
                        value={[alloc]}
                        onValueChange={([v]) => updateAllocation(stock.ticker, v)}
                        max={maxAlloc}
                        step={1}
                        disabled={!arbitrage.isOpen}
                        className="flex-1"
                      />
                      <span className="w-10 text-right font-mono text-xs font-semibold text-foreground tabular-nums">
                        {alloc}%
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => updateAllocation(stock.ticker, alloc + 5)}
                      disabled={!arbitrage.isOpen || alloc >= maxAlloc}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ── Barre basse fixe ───────────────────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="px-4 pt-3 pb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
              <span className="text-muted-foreground">Invested</span>
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

          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${totalAllocation}%` }} />
          </div>

          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!canSubmit}
            onClick={() => setShowConfirmDialog(true)}
          >
            {!arbitrage.isOpen ? (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Opens in {arbitrage.timeUntilOpen}
              </span>
            ) : totalAllocation === 0 ? (
              "Pick at least 1 stock"
            ) : (
              `Submit — ${totalAllocation}% invested, ${cashPct}% cash`
            )}
          </Button>
        </div>
      </div>

      {/* ── Dialog confirmation ───────────────────────────────── */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-card border-border max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Confirm your allocation
            </DialogTitle>
            <DialogDescription>
              {activeLeague
                ? `League: ${activeLeague.name}. It cannot be changed until the next window.`
                : "Check your allocation before submitting — it cannot be changed until the next window."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto my-2 space-y-1.5 pr-1">
            {TICKERS
              .filter((t) => (allocations[t.ticker] ?? 0) > 0)
              .sort((a, b) => (allocations[b.ticker] ?? 0) - (allocations[a.ticker] ?? 0))
              .map((t) => {
                const pct = allocations[t.ticker] ?? 0
                return (
                  <div key={t.ticker} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold text-foreground">
                      {t.ticker.replace(".", "").slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-foreground truncate">{t.ticker}</span>
                        <span className="text-xs font-bold text-foreground tabular-nums ml-2">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(pct / maxAlloc) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })
            }

            {cashPct > 0 && (
              <div className="flex items-center gap-3 pt-1 border-t border-border mt-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-500/15 text-xs font-bold text-green-500">💵</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-green-500">Cash</span>
                    <span className="text-xs font-bold text-green-500 tabular-nums ml-2">{cashPct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-green-500/60" style={{ width: `${cashPct}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-3 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Window closes in</span>
              <span className="font-mono font-semibold text-foreground">{arbitrage.timeUntilClose}</span>
            </div>
            {submitError && (
              <p className="text-xs text-red-500 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                {submitError}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isSubmitting ? "Saving…" : "Confirm"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
