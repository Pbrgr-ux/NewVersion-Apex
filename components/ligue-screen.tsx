"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy, Check, LogOut, Crown, Lock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { resolvePreset, isImageUrl } from "@/lib/avatars"
import type { LeagueDetail } from "@/lib/leagues"

function avatarSrc(a: string | null): string | null {
  const p = resolvePreset(a); if (p) return p.src
  return isImageUrl(a) ? a : null
}
function fmtPerf(v: number | null) {
  if (v == null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
}

export function LigueScreen({ detail }: { detail: LeagueDetail }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function copyCode() {
    await navigator.clipboard.writeText(detail.code)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }
  async function leave() {
    await fetch("/api/leagues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leave", leagueId: detail.id }) })
    router.push("/ligue"); router.refresh()
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
          {detail.code}
        </button>
      </div>

      <h1 className="text-lg font-bold text-foreground mb-1">{detail.name}</h1>
      <p className="text-xs text-muted-foreground mb-4">{detail.members.length} member{detail.members.length > 1 ? "s" : ""} · share the code to invite</p>

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

      {/* Indice Pro pour voir les positions */}
      {!detail.isPro && (
        <Link href="/pro" className="mt-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <Lock className="h-4 w-4 text-primary" />
          <span><span className="font-semibold text-primary">Go Pro</span> to see members&apos; positions</span>
        </Link>
      )}

      {/* Quitter */}
      <button onClick={leave} className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm text-red-600">
        <LogOut className="h-4 w-4" /> Leave league
      </button>
    </main>
  )
}
