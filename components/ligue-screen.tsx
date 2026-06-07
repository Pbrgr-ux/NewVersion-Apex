"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy, Check, LogOut, Crown, Lock, TrendingUp, Ban } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { resolvePreset, isImageUrl } from "@/lib/avatars"
import { formatCode } from "@/lib/league-codes"
import type { LeagueDetail } from "@/lib/leagues"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function avatarSrc(a: string | null): string | null {
  const p = resolvePreset(a); if (p) return p.src
  return isImageUrl(a) ? a : null
}
function fmtPerf(v: number | null) {
  if (v == null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
}
function fmtPrix(v: number | null) {
  if (v == null) return "—"
  return v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function LigueScreen({ detail }: { detail: LeagueDetail }) {
  const router = useRouter()
  const [copied, setCopied]   = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy]       = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [err, setErr]         = useState("")

  async function copyCode() {
    await navigator.clipboard.writeText(formatCode(detail.code))
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }
  async function action(act: "leave" | "end") {
    setBusy(true); setErr("")
    try {
      const res = await fetch("/api/leagues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: act, leagueId: detail.id }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(json?.error ?? "Error"); return }
      if (act === "leave") { router.push("/ligue") }
      router.refresh()
    } finally { setBusy(false) }
  }

  return (
    <main className="flex min-h-svh flex-col bg-background px-4 pt-2 pb-24">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/ligue" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Leagues
        </Link>
        <button onClick={copyCode} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-mono font-semibold text-foreground">
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
          {formatCode(detail.code)}
        </button>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-lg font-bold text-foreground">{detail.name}</h1>
        {detail.statut !== "active" && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">Ended</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">{detail.members.length} member{detail.members.length > 1 ? "s" : ""} · share the code to invite</p>

      {/* Config de la compétition */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-muted-foreground">Capital</p>
          <p className="font-semibold text-foreground tabular-nums">{detail.capital_initial.toLocaleString("en-US")} €</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-muted-foreground">Duration</p>
          <p className="font-semibold text-foreground">
            {detail.duration_mode === "permanent"
              ? "Permanent"
              : detail.fin_date ? `Until ${new Date(detail.fin_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}` : "Fixed"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-muted-foreground">Window</p>
          <p className="font-semibold text-foreground">
            {detail.fenetre_jours.slice().sort((a, b) => a - b).map((d) => DAY_LABELS[d]).join(", ")} · {detail.fenetre_heure_debut}–{detail.fenetre_heure_fin}h
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-muted-foreground">Universe</p>
          <p className="font-semibold text-foreground">
            {detail.tickers_autorises && detail.tickers_autorises.length > 0 ? `${detail.tickers_autorises.length} stocks` : "All stocks"} · max {detail.max_allocation_pct}%
          </p>
        </div>
      </div>

      {/* Trader pour cette ligue */}
      {detail.statut === "active" && (
        <Link href={`/arbitrage?league=${detail.id}`}
          className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          <TrendingUp className="h-4 w-4" /> Trade for this league
        </Link>
      )}

      {/* Classement membres */}
      <div className="flex flex-col gap-2">
        {detail.members.map((m) => (
          <div key={m.user_id} className={`rounded-xl border bg-card ${m.isSelf ? "border-green-600/40 bg-green-600/5" : "border-border"}`}>
            <button
              onClick={() => detail.isPro && setExpanded(expanded === m.user_id ? null : m.user_id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
            >
              <span className="w-5 text-center text-sm font-bold tabular-nums text-muted-foreground">{m.rang}</span>
              <Avatar className="h-8 w-8 shrink-0">
                {avatarSrc(m.avatar) && <AvatarImage src={avatarSrc(m.avatar)!} alt="" />}
                <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">{m.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <span className={`truncate text-sm ${m.isSelf ? "font-bold" : "font-medium"} text-foreground`}>{m.pseudo}{m.isSelf && <span className="ml-1 text-xs font-normal opacity-60">(you)</span>}</span>
                {m.is_pro && <Crown className="h-3 w-3 text-primary shrink-0" />}
              </div>
              <span className={`text-sm font-bold tabular-nums ${(m.perf ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtPerf(m.perf)}</span>
            </button>

            {/* Positions (Pro) */}
            {detail.isPro && expanded === m.user_id && (
              <div className="border-t border-border px-3 py-2">
                {m.positions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No position</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {m.positions.map((p) => (
                      <span key={p.ticker} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-foreground">
                        {p.ticker} <span className="text-muted-foreground">{p.allocation_pct}%</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mes positions dans cette ligue (style dashboard) */}
      {detail.myPositions.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">My positions</h3>
          <div className="flex flex-col gap-2">
            {detail.myPositions.map((pos) => {
              const positive = (pos.variation ?? 0) >= 0
              return (
                <Link key={pos.ticker} href={`/stock/${encodeURIComponent(pos.ticker)}`}>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 transition-colors hover:border-primary/40">
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
                      <div className="flex flex-col items-end leading-tight">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          Acq {pos.open_price != null ? pos.open_price.toFixed(2) : "—"}
                        </span>
                        <span className="text-sm font-medium tabular-nums text-foreground">
                          {pos.prix_actuel != null ? pos.prix_actuel.toFixed(2) : "—"}
                        </span>
                      </div>
                      <div className="flex w-20 flex-col items-end leading-tight">
                        <span className={`text-sm font-bold tabular-nums ${
                          pos.variation == null ? "text-muted-foreground" : positive ? "text-green-600" : "text-red-600"
                        }`}>
                          {pos.variation == null ? "—" : fmtPerf(pos.variation)}
                        </span>
                        <span className={`text-xs font-medium tabular-nums ${
                          pos.pnl_eur == null ? "text-muted-foreground" : positive ? "text-green-600" : "text-red-600"
                        }`}>
                          {pos.pnl_eur == null ? "—" : `${pos.pnl_eur >= 0 ? "+" : ""}${fmtPrix(pos.pnl_eur)} €`}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Indice Pro pour voir les positions */}
      {!detail.isPro && (
        <Link href="/pro" className="mt-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <Lock className="h-4 w-4 text-primary" />
          <span><span className="font-semibold text-primary">Go Pro</span> to see members&apos; positions</span>
        </Link>
      )}

      {err && <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">{err}</p>}

      {/* Admin (owner) : arrêter la ligue ; membre : quitter */}
      {detail.isOwner ? (
        detail.statut === "active" && (
          !confirmEnd ? (
            <button onClick={() => setConfirmEnd(true)} disabled={busy}
              className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm text-red-600 disabled:opacity-60">
              <Ban className="h-4 w-4" /> Stop league
            </button>
          ) : (
            <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-xs text-foreground mb-2">
                Stop <span className="font-semibold">{detail.name}</span>? The ranking will be frozen and trading closed. This can&apos;t be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmEnd(false)} disabled={busy}
                  className="flex-1 rounded-lg border border-border bg-card py-2 text-xs font-semibold text-foreground disabled:opacity-60">
                  Cancel
                </button>
                <button onClick={() => action("end")} disabled={busy}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-semibold text-white disabled:opacity-60">
                  {busy ? "Stopping…" : "Stop league"}
                </button>
              </div>
            </div>
          )
        )
      ) : (
        <button onClick={() => action("leave")} disabled={busy}
          className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm text-red-600 disabled:opacity-60">
          <LogOut className="h-4 w-4" /> Leave league
        </button>
      )}
    </main>
  )
}
