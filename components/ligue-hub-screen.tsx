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
      setError("Donne un nom à ta ligue.")
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
      setError("Code invalide. Format attendu : WOLF-42")
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
          <h1 className="text-sm font-bold text-foreground">Ligues Privées</h1>
          <p className="mt-1 text-sm text-muted-foreground">Compétez entre amis, un seul vainqueur.</p>
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
                <p className="font-semibold text-foreground">Créer une ligue</p>
                <p className="text-xs text-muted-foreground mt-0.5">Génère un code d'invitation · PRO requis</p>
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
                <p className="font-semibold text-foreground">Rejoindre une ligue</p>
                <p className="text-xs text-muted-foreground mt-0.5">Entre un code reçu d'un ami</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* My leagues shortcut */}
            <Link
              href="/ligue/alpha-wolves"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Lock className="h-4 w-4" />
              Voir ma ligue actuelle
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
              ← Retour
            </button>

            <div>
              <h2 className="text-lg font-semibold text-foreground">Nouvelle ligue</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Un code court sera généré automatiquement.</p>
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
                <span className="font-medium text-foreground">Réservé aux membres PRO.</span>{" "}
                Chaque joueur peut créer jusqu'à 3 ligues par saison.
              </p>
            </div>

            <button
              type="submit"
              className="mt-1 w-full rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
            >
              Créer la ligue →
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
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Ligue créée</p>
              <h2 className="text-xl font-bold text-foreground">{leagueName}</h2>
            </div>

            <div className="w-full rounded-xl border border-primary/30 bg-primary/10 p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Code d'invitation</p>
              <p className="text-3xl font-bold tracking-widest text-primary font-mono">{generatedCode}</p>
              <p className="text-xs text-muted-foreground mt-2">Partage ce code avec tes adversaires</p>
            </div>

            <Link
              href="/ligue/alpha-wolves"
              className="w-full rounded-lg bg-primary px-4 py-3.5 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Accéder à la ligue →
            </Link>

            <button
              onClick={() => { setView("choose"); setLeagueName(""); setGeneratedCode("") }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Créer une autre ligue
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
              ← Retour
            </button>

            <div>
              <h2 className="text-lg font-semibold text-foreground">Rejoindre une ligue</h2>
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
              Rejoindre →
            </button>
          </form>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center justify-around py-2">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
          <Link href="/classement" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-medium">Classement</span>
          </Link>
          <Link href="/profil" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    </main>
  )
}
