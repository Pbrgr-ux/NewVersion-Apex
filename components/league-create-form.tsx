"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { TICKERS } from "@/lib/tickers"

const INPUT = "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
const LABEL = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
const JOURS_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export type LeaguePayload = {
  duration_mode:       "fixed" | "permanent"
  debut_date:          string | null
  fin_date:            string | null
  capital_initial:     number
  max_allocation_pct:  number
  tickers_autorises:   string[] | null
  fenetre_jours:       number[]
  fenetre_heure_debut: number
  fenetre_heure_fin:   number
}

type Props = {
  busy:     boolean
  error:    string
  onBack:   () => void
  onSubmit: (name: string, config: LeaguePayload) => void
}

export function LeagueCreateForm({ busy, error, onBack, onSubmit }: Props) {
  const today = new Date().toISOString().split("T")[0]

  const [name, setName]               = useState("")
  const [duration, setDuration]       = useState<"permanent" | "fixed">("permanent")
  const [debut, setDebut]             = useState(today)
  const [fin, setFin]                 = useState(today)
  const [capital, setCapital]         = useState(100000)
  const [maxAlloc, setMaxAlloc]       = useState(50)
  const [allTickers, setAllTickers]   = useState(true)
  const [tickers, setTickers]         = useState<string[]>([])
  const [jours, setJours]             = useState<number[]>([6, 0])
  const [hDebut, setHDebut]           = useState(8)
  const [hFin, setHFin]               = useState(21)

  function toggleJour(j: number) {
    setJours((prev) => prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j].sort())
  }
  function toggleTicker(t: string) {
    setTickers((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(name, {
      duration_mode:       duration,
      debut_date:          duration === "fixed" ? debut : null,
      fin_date:            duration === "fixed" ? fin : null,
      capital_initial:     capital,
      max_allocation_pct:  maxAlloc,
      tickers_autorises:   allTickers ? null : tickers,
      fenetre_jours:       jours,
      fenetre_heure_debut: hDebut,
      fenetre_heure_fin:   hFin,
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <button type="button" onClick={onBack} className="self-start text-xs text-muted-foreground hover:text-foreground">← Back</button>
      <div>
        <h2 className="text-lg font-semibold text-foreground">New league</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Your own competition — an invite code is generated automatically.</p>
      </div>

      {/* Nom */}
      <div>
        <label className={LABEL}>League name</label>
        <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Wolves of Wall Street" maxLength={32} required />
      </div>

      {/* Durée */}
      <div>
        <label className={LABEL}>Duration</label>
        <div className="flex gap-2">
          {([["permanent", "Permanent"], ["fixed", "Fixed dates"]] as const).map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => setDuration(val)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                duration === val ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"
              }`}>
              {lbl}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {duration === "permanent" ? "All-time ranking since creation." : "Ranking freezes at the end date."}
        </p>
      </div>

      {duration === "fixed" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Start date</label>
            <input className={INPUT} type="date" value={debut} onChange={(e) => setDebut(e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>End date</label>
            <input className={INPUT} type="date" value={fin} onChange={(e) => setFin(e.target.value)} required />
          </div>
        </div>
      )}

      {/* Capital + max alloc */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Starting capital (€)</label>
          <input className={INPUT} type="number" min={1000} step={1000} value={capital}
            onChange={(e) => setCapital(parseInt(e.target.value) || 0)} required />
        </div>
        <div>
          <label className={LABEL}>Max per stock (%)</label>
          <input className={INPUT} type="number" min={1} max={100} value={maxAlloc}
            onChange={(e) => setMaxAlloc(parseInt(e.target.value) || 0)} required />
        </div>
      </div>

      {/* Fenêtre de trading */}
      <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Trading window</h3>
        <div>
          <label className={LABEL}>Open days</label>
          <div className="flex gap-2 flex-wrap">
            {JOURS_LABELS.map((label, idx) => (
              <button key={idx} type="button" onClick={() => toggleJour(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  jours.includes(idx) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Open time</label>
            <div className="flex items-center gap-2">
              <input className={INPUT} type="number" min={0} max={23} value={hDebut} onChange={(e) => setHDebut(parseInt(e.target.value) || 0)} />
              <span className="text-sm text-muted-foreground">h00</span>
            </div>
          </div>
          <div>
            <label className={LABEL}>Close time</label>
            <div className="flex items-center gap-2">
              <input className={INPUT} type="number" min={0} max={23} value={hFin} onChange={(e) => setHFin(parseInt(e.target.value) || 0)} />
              <span className="text-sm text-muted-foreground">h00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Univers d'actions */}
      <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Stock universe</h3>
        <div className="flex items-center gap-3">
          <input id="all" type="checkbox" checked={allTickers} onChange={(e) => setAllTickers(e.target.checked)} className="h-4 w-4 accent-primary" />
          <label htmlFor="all" className="text-sm text-foreground">All stocks</label>
        </div>
        {!allTickers && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{tickers.length} stock(s) selected</p>
            {(["US", "Europe", "ETF"] as const).map((region) => (
              <div key={region}>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">{region}</p>
                <div className="flex flex-wrap gap-1.5">
                  {TICKERS.filter((t) => t.region === region).map((t) => (
                    <button key={t.ticker} type="button" onClick={() => toggleTicker(t.ticker)}
                      className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                        tickers.includes(t.ticker) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/40"
                      }`}>
                      {t.ticker}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</p>}

      <button type="submit" disabled={busy || !name.trim() || (!allTickers && tickers.length === 0)}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create league →
      </button>
    </form>
  )
}
