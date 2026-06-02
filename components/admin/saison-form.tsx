"use client"

import { useState, useTransition } from "react"
import { useRouter }               from "next/navigation"
import { TICKERS }                 from "@/lib/tickers"
import type { SaisonRow }          from "@/lib/admin-seasons"

type FormData = {
  nom:                 string
  type:                "trimestrielle" | "speciale"
  debut_date:          string
  fin_date:            string
  statut:              "active" | "a_venir" | "terminee"
  capital_initial:     number
  max_allocation_pct:  number
  fenetre_jours:       number[]
  fenetre_heure_debut: number
  fenetre_heure_fin:   number
  inscription_requise: boolean
  tickers_tous:        boolean
  tickers_autorises:   string[]
}

const JOURS_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

function defaultForm(): FormData {
  const today = new Date().toISOString().split("T")[0]
  return {
    nom:                 "",
    type:                "trimestrielle",
    debut_date:          today,
    fin_date:            today,
    statut:              "a_venir",
    capital_initial:     100000,
    max_allocation_pct:  50,
    fenetre_jours:       [6, 0],    // sam + dim
    fenetre_heure_debut: 8,
    fenetre_heure_fin:   21,
    inscription_requise: false,
    tickers_tous:        true,
    tickers_autorises:   [],
  }
}

function saisonToForm(s: SaisonRow): FormData {
  return {
    nom:                 s.nom ?? "",
    type:                (s.type as "trimestrielle" | "speciale") ?? "trimestrielle",
    debut_date:          s.debut_date,
    fin_date:            s.fin_date,
    statut:              (s.statut as "active" | "a_venir" | "terminee") ?? "a_venir",
    capital_initial:     Number(s.capital_initial) || 100000,
    max_allocation_pct:  s.max_allocation_pct ?? 50,
    fenetre_jours:       s.fenetre_jours ?? [6, 0],
    fenetre_heure_debut: s.fenetre_heure_debut ?? 8,
    fenetre_heure_fin:   s.fenetre_heure_fin ?? 21,
    inscription_requise: s.inscription_requise ?? false,
    tickers_tous:        !s.tickers_autorises || s.tickers_autorises.length === 0,
    tickers_autorises:   s.tickers_autorises ?? [],
  }
}

const INPUT = "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
const LABEL = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"

type Props = {
  saison?: SaisonRow      // undefined = création
  onSubmit: (data: Omit<FormData, "tickers_tous">) => Promise<void>
}

export function SaisonForm({ saison, onSubmit }: Props) {
  const router            = useRouter()
  const [isPending, startT] = useTransition()
  const [form, setForm]   = useState<FormData>(saison ? saisonToForm(saison) : defaultForm())
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleJour(j: number) {
    set("fenetre_jours", form.fenetre_jours.includes(j)
      ? form.fenetre_jours.filter((x) => x !== j)
      : [...form.fenetre_jours, j].sort()
    )
  }

  function toggleTicker(ticker: string) {
    set("tickers_autorises", form.tickers_autorises.includes(ticker)
      ? form.tickers_autorises.filter((t) => t !== ticker)
      : [...form.tickers_autorises, ticker]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startT(async () => {
      try {
        const { tickers_tous, ...rest } = form
        await onSubmit({
          ...rest,
          tickers_autorises: tickers_tous ? [] : form.tickers_autorises,
        })
        router.push("/admin")
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">

      {/* Nom + type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={LABEL}>Season name</label>
          <input className={INPUT} value={form.nom} onChange={(e) => set("nom", e.target.value)}
            placeholder="e.g. Season 3 — 2026 / Spring Cup" required />
        </div>
        <div>
          <label className={LABEL}>Type</label>
          <select className={INPUT} value={form.type} onChange={(e) => set("type", e.target.value as "trimestrielle" | "speciale")}>
            <option value="trimestrielle">Quarterly</option>
            <option value="speciale">Special</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Status</label>
          <select className={INPUT} value={form.statut} onChange={(e) => set("statut", e.target.value as FormData["statut"])}>
            <option value="a_venir">Upcoming</option>
            <option value="active">Active</option>
            <option value="terminee">Ended</option>
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Start date</label>
          <input className={INPUT} type="date" value={form.debut_date}
            onChange={(e) => set("debut_date", e.target.value)} required />
        </div>
        <div>
          <label className={LABEL}>End date</label>
          <input className={INPUT} type="date" value={form.fin_date}
            onChange={(e) => set("fin_date", e.target.value)} required />
        </div>
      </div>

      {/* Capital + max allocation */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Starting capital (€)</label>
          <input className={INPUT} type="number" min={1000} step={1000} value={form.capital_initial}
            onChange={(e) => set("capital_initial", parseInt(e.target.value))} required />
        </div>
        <div>
          <label className={LABEL}>Max per stock (%)</label>
          <input className={INPUT} type="number" min={1} max={100} value={form.max_allocation_pct}
            onChange={(e) => set("max_allocation_pct", parseInt(e.target.value))} required />
        </div>
      </div>

      {/* Fenêtre d'arbitrage */}
      <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Trading window</h3>

        <div>
          <label className={LABEL}>Open days</label>
          <div className="flex gap-2 flex-wrap">
            {JOURS_LABELS.map((label, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleJour(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  form.fenetre_jours.includes(idx)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Open time</label>
            <div className="flex items-center gap-2">
              <input className={INPUT} type="number" min={0} max={23} value={form.fenetre_heure_debut}
                onChange={(e) => set("fenetre_heure_debut", parseInt(e.target.value))} />
              <span className="text-sm text-muted-foreground">h00</span>
            </div>
          </div>
          <div>
            <label className={LABEL}>Close time</label>
            <div className="flex items-center gap-2">
              <input className={INPUT} type="number" min={0} max={23} value={form.fenetre_heure_fin}
                onChange={(e) => set("fenetre_heure_fin", parseInt(e.target.value))} />
              <span className="text-sm text-muted-foreground">h00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inscription */}
      <div className="flex items-center gap-3">
        <input
          id="inscription"
          type="checkbox"
          checked={form.inscription_requise}
          onChange={(e) => set("inscription_requise", e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <label htmlFor="inscription" className="text-sm text-foreground">
          Optional sign-up (special season — players must join manually)
        </label>
      </div>

      {/* Tickers */}
      <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Stock universe</h3>
        <div className="flex items-center gap-3">
          <input id="tous" type="checkbox" checked={form.tickers_tous}
            onChange={(e) => set("tickers_tous", e.target.checked)} className="h-4 w-4 accent-primary" />
          <label htmlFor="tous" className="text-sm text-foreground">All 65 stocks</label>
        </div>

        {!form.tickers_tous && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {form.tickers_autorises.length} stock(s) selected
            </p>
            {(["US", "Europe", "ETF"] as const).map((region) => (
              <div key={region}>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">{region}</p>
                <div className="flex flex-wrap gap-1.5">
                  {TICKERS.filter((t) => t.region === region).map((t) => (
                    <button
                      key={t.ticker}
                      type="button"
                      onClick={() => toggleTicker(t.ticker)}
                      className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                        form.tickers_autorises.includes(t.ticker)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {t.ticker}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-border bg-secondary py-3 text-sm font-semibold text-foreground hover:bg-card"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : saison ? "Update" : "Create season"}
        </button>
      </div>
    </form>
  )
}
