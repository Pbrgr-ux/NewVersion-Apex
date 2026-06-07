"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Lock, Users, Plus, ArrowRight, ChevronRight, Loader2 } from "lucide-react"
import type { LeagueSummary } from "@/lib/leagues"
import { LeagueCreateForm, type LeaguePayload } from "@/components/league-create-form"

type View = "list" | "create" | "join"

export function LigueHubScreen({ leagues, isPro = false }: { leagues: LeagueSummary[]; isPro?: boolean }) {
  const router = useRouter()
  const [view, setView]   = useState<View>("list")
  const [code, setCode]   = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy]   = useState(false)

  async function call(action: string, payload: Record<string, unknown>) {
    setBusy(true); setError("")
    try {
      const res = await fetch("/api/leagues", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json?.error ?? "Error"); return }
      if (json.id) { router.push(`/ligue/${json.id}`); router.refresh() }
    } finally { setBusy(false) }
  }

  return (
    <main className="flex min-h-svh flex-col bg-background px-4 pt-2 pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-5 w-5 text-primary" />
        <h1 className="text-base font-bold tracking-tight text-foreground uppercase">Private Leagues</h1>
      </div>

      {view === "list" && (
        <div className="flex flex-col gap-3">
          {/* Mes ligues */}
          {leagues.map((l) => (
            <Link key={l.id} href={`/ligue/${l.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/40">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary font-bold">
                {l.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{l.name}</p>
                <p className="text-xs text-muted-foreground">
                  {l.members} member{l.members > 1 ? "s" : ""}
                  {l.myRank && <> · You #{l.myRank}</>}
                  {l.isOwner && <> · Owner</>}
                  {l.statut !== "active" ? <> · Ended</> : l.duration_mode === "permanent" ? <> · Permanent</> : null}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}

          {/* Actions */}
          {isPro ? (
            <button onClick={() => { setView("create"); setError("") }}
              className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/10 p-4 text-left active:scale-[0.98]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20"><Plus className="h-5 w-5 text-primary" /></div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Create a league</p>
                <p className="text-xs text-muted-foreground">PRO · up to 3 leagues</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <Link href="/pro"
              className="flex items-center gap-4 rounded-xl border border-border bg-card/60 p-4 text-left opacity-70">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><Lock className="h-5 w-5 text-muted-foreground" /></div>
              <div className="flex-1">
                <p className="font-semibold text-muted-foreground">Create a league</p>
                <p className="text-xs text-muted-foreground">Pro required · tap to upgrade</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}

          <button onClick={() => { setView("join"); setError("") }}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left active:scale-[0.98]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><Users className="h-5 w-5 text-foreground" /></div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Join a league</p>
              <p className="text-xs text-muted-foreground">Enter a code from a friend</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {view === "create" && (
        <LeagueCreateForm
          busy={busy}
          error={error}
          onBack={() => { setView("list"); setError("") }}
          onSubmit={(name: string, config: LeaguePayload) => call("create", { name, config })}
        />
      )}

      {view === "join" && (
        <form onSubmit={(e) => { e.preventDefault(); call("join", { code }) }} className="flex flex-col gap-4">
          <button type="button" onClick={() => setView("list")} className="self-start text-xs text-muted-foreground hover:text-foreground">← Back</button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Join a league</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Enter the invite code.</p>
          </div>
          <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError("") }}
            placeholder="e.g. ABCD-EFGH" maxLength={9}
            className="w-full rounded-lg border border-border bg-input px-4 py-3 text-center font-mono text-lg tracking-widest text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={busy || code.replace(/[^A-Za-z0-9]/g, "").length < 4}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Join →
          </button>
        </form>
      )}
    </main>
  )
}
