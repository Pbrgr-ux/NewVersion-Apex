"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { TrendingUp, Lock, Users, Plus, ArrowRight, Home, BarChart3, User } from "lucide-react"

type HubView = "choose" | "create" | "join" | "created"

function generateCode(name: string): string {
  const prefix = name.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "TL"
  const num = (name.length * 7 + 13) % 90 + 10
  return `${prefix}-${num}`
}

export function LigueHubScreen() {
  const router = useRouter()
  const [view, setView] = useState<HubView>("choose")
  const [leagueName, setLeagueName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [error, setError] = useState("")

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!leagueName.trim()) {
      setError("Give your league a name.")
      return
    }
    const code = generateCode(leagueName)
    setGeneratedCode(code)
    setView("created")
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code.match(/^[A-Z]{2,4}-\d{2}$/)) {
      setError("Invalid code. Expected format: WOLF-42")
      return
    }
    // In prod: verify code in Supabase, get league_id, redirect
    router.push("/ligue/alpha-wolves")
  }

  return (
    <main className="flex min-h-svh flex-col bg-background pb-24">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 px-6 pt-10 pb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-sm font-bold text-foreground">Private Leagues</h1>
          <p className="mt-1 text-sm text-muted-foreground">Compete with friends, one winner.</p>
        </div>
      </div>

      <div className="px-4">
        {/* Choose view */}
        {view === "choose" && (
          <div className="flex flex-col gap-3">
            {/* Create card */}
            <button
              onClick={() => { setView("create"); setError("") }}
              className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/10 p-5 text-left transition-all active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Create a league</p>
                <p className="text-xs text-muted-foreground mt-0.5">Generate an invite code · PRO required</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Join card */}
            <button
              onClick={() => { setView("join"); setError("") }}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition-all active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Join a league</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enter a code from a friend</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* My leagues shortcut */}
            <Link
              href="/ligue/alpha-wolves"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Lock className="h-4 w-4" />
              View my current league
            </Link>
          </div>
        )}

        {/* Create form */}
        {view === "create" && (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => { setView("choose"); setError("") }}
              className="self-start text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>

            <div>
              <h2 className="text-lg font-semibold text-foreground">New league</h2>
              <p className="text-xs text-muted-foreground mt-0.5">A short code will be generated automatically.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Nom de la ligue
              </label>
              <input
                type="text"
                value={leagueName}
                onChange={(e) => { setLeagueName(e.target.value); setError("") }}
                placeholder="Ex: Alpha Wolves"
                maxLength={32}
                className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {error && <p className="text-xs text-danger">{error}</p>}
            </div>

            <div className="rounded-lg border border-border bg-secondary/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">PRO members only.</span>{" "}
                Each player can create up to 3 leagues per season.
              </p>
            </div>

            <button
              type="submit"
              className="mt-1 w-full rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
            >
              Create league →
            </button>
          </form>
        )}

        {/* Created success */}
        {view === "created" && (
          <div className="flex flex-col items-center gap-6 pt-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 ring-2 ring-primary/30">
              <Lock className="h-8 w-8 text-primary" />
            </div>

            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">League created</p>
              <h2 className="text-xl font-bold text-foreground">{leagueName}</h2>
            </div>

            <div className="w-full rounded-xl border border-primary/30 bg-primary/10 p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Invite code</p>
              <p className="text-3xl font-bold tracking-widest text-primary font-mono">{generatedCode}</p>
              <p className="text-xs text-muted-foreground mt-2">Share this code with your rivals</p>
            </div>

            <Link
              href="/ligue/alpha-wolves"
              className="w-full rounded-lg bg-primary px-4 py-3.5 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Go to league →
            </Link>

            <button
              onClick={() => { setView("choose"); setLeagueName(""); setGeneratedCode("") }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Create another league
            </button>
          </div>
        )}

        {/* Join form */}
        {view === "join" && (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => { setView("choose"); setError("") }}
              className="self-start text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>

            <div>
              <h2 className="text-lg font-semibold text-foreground">Join a league</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Entre le code reçu d'un membre.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Code d'invitation
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError("") }}
                placeholder="WOLF-42"
                maxLength={8}
                className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm font-mono tracking-widest text-foreground placeholder:text-muted-foreground/50 placeholder:tracking-normal outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {error && <p className="text-xs text-danger">{error}</p>}
            </div>

            <button
              type="submit"
              className="mt-1 w-full rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
            >
              Join →
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
