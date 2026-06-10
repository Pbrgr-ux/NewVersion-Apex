"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy, Check, LogOut, Crown, Lock, Trash2 } from "lucide-react"
import { resolvePreset, isImageUrl } from "@/lib/avatars"
import { formatCode } from "@/lib/league-codes"
import type { FloorDetail } from "@/lib/floors"

function avatarSrc(a: string | null): string | null {
  const p = resolvePreset(a); if (p) return p.src
  return isImageUrl(a) ? a : null
}
function fmtPerf(v: number | null) {
  if (v == null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
}

export function FloorScreen({ detail }: { detail: FloorDetail }) {
  const router = useRouter()
  const [copied, setCopied]   = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [err, setErr]         = useState("")

  async function copyCode() {
    await navigator.clipboard.writeText(formatCode(detail.code))
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }
  async function action(act: "leave" | "delete") {
    setBusy(true); setErr("")
    try {
      const res = await fetch("/api/floors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: act, floorId: detail.id }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(json?.error ?? "Error"); return }
      router.push("/floors"); router.refresh()
    } finally { setBusy(false) }
  }

  return (
    <main className="flex min-h-svh flex-col bg-background px-4 pt-2 pb-24">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/floors" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Floors
        </Link>
        <button onClick={copyCode} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-mono font-semibold text-foreground">
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
          {formatCode(detail.code)}
        </button>
      </div>

      <h1 className="text-lg font-bold text-foreground mb-1">{detail.name}</h1>
      <p className="text-xs text-muted-foreground mb-4">{detail.members.length} member{detail.members.length > 1 ? "s" : ""} · ranked on the Major League</p>

      {/* Classement membres — même container que le dashboard */}
      <div className="rounded-xl border border-border bg-card px-2.5 py-3">
        <div className="mb-2 flex items-center justify-between px-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ranking</span>
          <span className="text-xs text-muted-foreground">Season</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {detail.members.map((m) => {
            const medal = m.rang === 1 ? "bg-amber-400 text-black" : m.rang === 2 ? "bg-slate-300 text-black" : m.rang === 3 ? "bg-orange-500 text-white" : "bg-secondary text-muted-foreground"
            const src = avatarSrc(m.avatar)
            return (
              <div key={m.user_id}>
                <button
                  onClick={() => detail.isPro && setExpanded(expanded === m.user_id ? null : m.user_id)}
                  className={`flex w-full items-center gap-2.5 px-2 py-1 text-left ${m.isSelf ? "rounded-[4px] bg-green-600/10" : ""}`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${medal}`}>{m.rang}</span>
                  {src ? (
                    <img src={src} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                      {m.pseudo.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className={`flex-1 min-w-0 truncate text-sm text-foreground ${m.isSelf ? "font-bold" : "font-medium"}`}>
                    {m.pseudo}{m.isSelf && <span className="ml-1 text-xs font-normal opacity-60">(you)</span>}
                    {m.is_pro && <Crown className="ml-1 inline h-3 w-3 text-primary" />}
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${m.perf == null ? "text-muted-foreground" : m.perf >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {fmtPerf(m.perf)}
                  </span>
                </button>

                {detail.isPro && expanded === m.user_id && (
                  <div className="mt-1 px-2 pb-1">
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
            )
          })}
        </div>
      </div>

      {/* Indice Pro pour voir les positions */}
      {!detail.isPro && (
        <Link href="/pro" className="mt-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <Lock className="h-4 w-4 text-primary" />
          <span><span className="font-semibold text-primary">Go Pro</span> to see members&apos; positions</span>
        </Link>
      )}

      {err && <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">{err}</p>}

      {/* Admin → supprimer ; membre → quitter */}
      {detail.isOwner ? (
        !confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} disabled={busy}
            className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm text-red-600 disabled:opacity-60">
            <Trash2 className="h-4 w-4" /> Delete floor
          </button>
        ) : (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-xs text-foreground mb-2">Delete <span className="font-semibold">{detail.name}</span>? This removes the floor for everyone. This can&apos;t be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} disabled={busy}
                className="flex-1 rounded-lg border border-border bg-card py-2 text-xs font-semibold text-foreground disabled:opacity-60">Cancel</button>
              <button onClick={() => action("delete")} disabled={busy}
                className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-semibold text-white disabled:opacity-60">{busy ? "Deleting…" : "Delete floor"}</button>
            </div>
          </div>
        )
      ) : (
        <button onClick={() => action("leave")} disabled={busy}
          className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm text-red-600 disabled:opacity-60">
          <LogOut className="h-4 w-4" /> Leave floor
        </button>
      )}
    </main>
  )
}
