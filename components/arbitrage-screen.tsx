"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { TICKERS }                 from "@/lib/tickers"
import { createClient }            from "@/lib/supabase/client"
import { getCurrentSeasonId }      from "@/lib/seasons"

// Saison courante — doit correspondre à celle lue par le dashboard
const CURRENT_SAISON = getCurrentSeasonId()
// Clé localStorage spécifique à l'utilisateur — évite de bloquer les autres
function lsKey(userId: string) { return `tl_lock_close_${userId}` }

type Region = "US" | "Europe" | "ETF"

// ── Mock prix + variation semaine (remplacé par cours Supabase en V2) ──
const MOCK_MARKET: Record<string, { price: number; weekChange: number }> = {
  // US
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
  // Europe
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
  // ETF
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

export function ArbitrageScreen() {
  const arbitrage = useArbitrageWindow()
  const supabase  = createClient()
  const router    = useRouter()

  const [activeTab, setActiveTab]     = useState<Region>("US")
  const [isLocked, setIsLocked]       = useState(false)
  const [userId, setUserId]           = useState<string | null>(null)
  const [sortVersion, setSortVersion] = useState(0)   // force re-tri après chargement initial

  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    TICKERS.forEach((t) => { init[t.ticker] = 0 })
    return init
  })
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting]           = useState(false)
  const [submitError, setSubmitError]             = useState<string | null>(null)

  // ── Charger l'allocation existante + vérifier le lock ──────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // 1. Charger le portfolio + positions existantes
      const { data: portfolios } = await supabase
        .from("portfolios")
        .select("id")
        .eq("user_id", user.id)
        .eq("saison", CURRENT_SAISON)
        .order("id", { ascending: false })
        .limit(1)

      const portfolioId = portfolios?.[0]?.id
      let hasPositions  = false

      if (portfolioId) {
        const { data: positions } = await supabase
          .from("positions")
          .select("ticker, allocation_pct")
          .eq("portfolio_id", portfolioId)

        if (positions && positions.length > 0) {
          hasPositions = true
          // Pré-remplir les sliders avec la répartition actuelle
          setAllocations((prev) => {
            const next = { ...prev }
            for (const p of positions) {
              next[p.ticker] = Number(p.allocation_pct)
            }
            return next
          })
          // Re-trier pour positionner les tickers alloués en tête
          setSortVersion((v) => v + 1)
        }
      }

      // 2. Vérifier le lock localStorage
      const lockedUntil = localStorage.getItem(lsKey(user.id))
      const lockActif   = lockedUntil != null && Date.now() < new Date(lockedUntil).getTime()

      if (lockActif && hasPositions) {
        // Lock valide + positions existantes → écran verrouillé
        setIsLocked(true)
      } else {
        // Lock expiré, orphelin, ou sans positions → débloquer
        localStorage.removeItem(lsKey(user.id))
      }
    }
    init()
  }, [supabase])

  // Tri : tickers alloués en tête. Recalculé uniquement au changement
  // d'onglet ou au chargement initial (pas à chaque mouvement de slider,
  // pour éviter que les cartes ne sautent pendant l'ajustement).
  const visibleStocks = useMemo(
    () => {
      const inTab = TICKERS.filter((t) => t.region === activeTab)
      return [...inTab].sort((a, b) => {
        const aOn = (allocations[a.ticker] ?? 0) > 0 ? 1 : 0
        const bOn = (allocations[b.ticker] ?? 0) > 0 ? 1 : 0
        return bOn - aOn   // alloués (1) avant non-alloués (0)
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab, sortVersion]
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
      // Ne pas dépasser 100% au total, ni 50% par action
      const maxForThis = Math.min(50, 100 - otherSum)
      return { ...prev, [ticker]: Math.max(0, Math.min(maxForThis, value)) }
    })
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non connecté — reconnectez-vous")

      // 2. Récupérer ou créer le portfolio de la saison courante
      let portfolioId: string

      const { data: existing } = await supabase
        .from("portfolios")
        .select("id")
        .eq("user_id", user.id)
        .eq("saison", CURRENT_SAISON)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing) {
        portfolioId = existing.id
      } else {
        const { data: created, error: cErr } = await supabase
          .from("portfolios")
          .insert({ user_id: user.id, saison: CURRENT_SAISON, cash: 0 })
          .select("id")
          .single()
        if (cErr || !created) throw new Error("Erreur création portfolio")
        portfolioId = created.id
      }

      // 3. Supprimer les anciennes positions
      await supabase.from("positions").delete().eq("portfolio_id", portfolioId)

      // 4. Insérer les nouvelles positions (allocation > 0 uniquement)
      const newPositions = TICKERS
        .filter((t) => (allocations[t.ticker] ?? 0) > 0)
        .map((t) => ({
          portfolio_id:   portfolioId,
          ticker:         t.ticker,
          allocation_pct: allocations[t.ticker],
          prix_achat:     MOCK_MARKET[t.ticker]?.price ?? 100,
        }))

      if (newPositions.length > 0) {
        const { error: iErr } = await supabase.from("positions").insert(newPositions)
        if (iErr) throw new Error("Erreur enregistrement positions")
      }

      // 5. Verrouiller jusqu'à la fermeture de la fenêtre (clé par user)
      if (arbitrage.windowCloseISO) {
        localStorage.setItem(lsKey(user.id), arbitrage.windowCloseISO)
      }
      setUserId(user.id)
      setShowConfirmDialog(false)
      router.push("/dashboard")

    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur inconnue")
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

  // ── Écran verrouillé ─────────────────────────────────────────
  if (isLocked) {
    return (
      <main className="flex min-h-svh flex-col bg-background pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 ${arbitrage.isOpen ? "text-green-500" : "text-muted-foreground"}`} />
              <span className="font-semibold text-foreground">
                {arbitrage.isOpen ? "Fenêtre ouverte" : "Fenêtre fermée"}
              </span>
            </div>
            <span className="font-mono text-sm text-muted-foreground">
              {arbitrage.isOpen
                ? <span>Ferme dans <span className="font-semibold text-green-500">{arbitrage.timeUntilClose}</span></span>
                : <span>Ouvre dans <span className="font-semibold">{arbitrage.timeUntilOpen}</span></span>
              }
            </span>
          </div>
        </header>

        {/* Bandeau validé */}
        <div className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 mt-0.5">
            <Lock className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-500">Portefeuille validé</p>
            <p className="text-xs text-muted-foreground">
              {arbitrage.isOpen
                ? "Modification impossible jusqu'à la fermeture de la fenêtre."
                : "Modifiable lors de la prochaine fenêtre d'arbitrage."}
            </p>
          </div>
          {/* Bouton déblocage manuel (si problème technique) */}
          {arbitrage.isOpen && userId && (
            <button
              onClick={() => {
                localStorage.removeItem(lsKey(userId))
                setIsLocked(false)
              }}
              className="shrink-0 rounded-lg border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              Modifier
            </button>
          )}
        </div>

        {/* Récap allocation soumise */}
        <div className="px-4 py-4 space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Répartition soumise
          </h3>

          {submittedPositions.map((t) => {
            const pct    = allocations[t.ticker] ?? 0
            const market = MOCK_MARKET[t.ticker]
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
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(pct / 50) * 100}%` }} />
                  </div>
                </div>
              </div>
            )
          })}

          {/* Cash */}
          {cashPct > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-card border border-green-500/20 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/15 text-sm">
                💵
              </div>
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

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-xl items-center justify-around py-2">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
              <Home className="h-5 w-5" /><span className="text-[10px] font-medium">Dashboard</span>
            </Link>
            <Link href="/classement" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
              <BarChart3 className="h-5 w-5" /><span className="text-[10px] font-medium">Classement</span>
            </Link>
            <Link href="/profil" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
              <User className="h-5 w-5" /><span className="text-[10px] font-medium">Profil</span>
            </Link>
          </div>
        </nav>
      </main>
    )
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

      {/* ── Onglets US / Europe / ETF ──────────────────────────── */}
      <div className="sticky top-[57px] z-30 border-b border-border bg-background px-4 py-2">
        <div className="flex gap-2">
          {TABS.map((tab) => {
            const tabTotal = TICKERS
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
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
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

      {/* ── Liste des actions ──────────────────────────────────── */}
      <div className="flex-1 px-4 py-4">
        <div className="mb-3 flex items-center justify-end">
          <span className="text-xs text-muted-foreground">Max 50 % par action</span>
        </div>

        <div className="flex flex-col gap-2">
          {visibleStocks.map((stock) => {
            const market = MOCK_MARKET[stock.ticker] ?? { price: 100, weekChange: 0 }
            const alloc  = allocations[stock.ticker] ?? 0
            return (
              <Card
                key={stock.ticker}
                className={`border-border overflow-hidden transition-opacity py-0 gap-0 ${
                  arbitrage.isOpen ? "bg-card" : "bg-card opacity-60"
                }`}
              >
                <CardContent className="p-0">
                  {/* Ligne infos + prix */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-foreground">
                        {stock.ticker.replace(".", "").slice(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground leading-tight">{stock.ticker}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{stock.name}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium tabular-nums text-foreground">
                        {market.price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[10px] font-medium tabular-nums ${
                        market.weekChange >= 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {market.weekChange >= 0 ? "+" : ""}{market.weekChange.toFixed(2)}% /7j
                      </span>
                    </div>
                  </div>

                  {/* Slider allocation */}
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
                        max={50}
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
                      disabled={!arbitrage.isOpen || alloc >= 50}
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
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center justify-around py-2">
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
        <DialogContent className="bg-card border-border max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Confirmer l&apos;allocation
            </DialogTitle>
            <DialogDescription>
              Vérifiez la répartition avant de valider — elle ne pourra pas être modifiée avant la prochaine fenêtre.
            </DialogDescription>
          </DialogHeader>

          {/* ── Répartition détaillée ── */}
          <div className="flex-1 overflow-y-auto my-2 space-y-1.5 pr-1">
            {TICKERS
              .filter((t) => (allocations[t.ticker] ?? 0) > 0)
              .sort((a, b) => (allocations[b.ticker] ?? 0) - (allocations[a.ticker] ?? 0))
              .map((t) => {
                const pct = allocations[t.ticker] ?? 0
                return (
                  <div key={t.ticker} className="flex items-center gap-3">
                    {/* Pastille ticker */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-foreground">
                      {t.ticker.replace(".", "").slice(0, 2)}
                    </div>
                    {/* Nom */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-foreground truncate">{t.ticker}</span>
                        <span className="text-xs font-bold text-foreground tabular-nums ml-2">{pct}%</span>
                      </div>
                      {/* Mini barre */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(pct / 50) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            }

            {/* Ligne Cash si > 0 */}
            {cashPct > 0 && (
              <div className="flex items-center gap-3 pt-1 border-t border-border mt-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-500/15 text-[10px] font-bold text-green-500">
                  💵
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-green-500">Cash</span>
                    <span className="text-xs font-bold text-green-500 tabular-nums ml-2">{cashPct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-green-500/60"
                      style={{ width: `${cashPct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Pied : timer + boutons ── */}
          <div className="border-t border-border pt-3 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Fenêtre se ferme dans</span>
              <span className="font-mono font-semibold text-foreground">{arbitrage.timeUntilClose}</span>
            </div>
            {submitError && (
              <p className="text-xs text-red-500 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                {submitError}
              </p>
            )}
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
                {isSubmitting ? "Enregistrement…" : "Confirmer"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
