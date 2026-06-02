"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Crown, LogOut, Calendar, Trophy,
  Zap, Home, BarChart3, User, ChevronRight,
  Loader2, KeyRound, TrendingUp, TrendingDown,
  Settings,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button }            from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge }             from "@/components/ui/badge"
import { createClient }      from "@/lib/supabase/client"
import type { ProfilData }   from "@/lib/profil-data"

// ── Helpers ───────────────────────────────────────────────────
function fmtPerf(v: number | null): string {
  if (v == null) return "—"
  const sign = v >= 0 ? "+" : ""
  return `${sign}${v.toFixed(2)}%`
}

function perfColor(v: number | null): string {
  if (v == null) return "text-muted-foreground"
  return v >= 0 ? "text-green-500" : "text-red-500"
}


// ── Composant ─────────────────────────────────────────────────
export function ProfilScreen({ data }: { data: ProfilData }) {
  const router   = useRouter()
  const supabase = createClient()
  const [loggingOut, setLoggingOut] = useState(false)

  const { user, saison, historique, positions, hasPortfolio } = data
  const { isPro, isAdmin } = user

  const initials    = user.pseudo.slice(0, 2).toUpperCase()
  const memberDate  = new Date(user.memberSince).toLocaleDateString("fr-FR", {
    month: "long", year: "numeric",
  })

  async function handleLogOut() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">

      {/* ── Header avatar ────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-6">
        <Avatar className="h-24 w-24 border-2 border-primary">
          <AvatarFallback className="bg-secondary text-2xl font-bold text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{user.pseudo}</h1>
            {isPro && (
              <Badge className="bg-primary text-primary-foreground">
                <Crown className="mr-1 h-3 w-3" />PRO
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Membre depuis {memberDate}</span>
          </div>
        </div>
      </div>

      {/* ── Classement saison courante ───────────────────────── */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center gap-0.5 py-3 px-2">
            <Trophy className="h-5 w-5 text-primary mb-0.5" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Classement
            </span>
            <span className="text-xl font-bold text-foreground">
              {saison.rang != null ? `#${saison.rang}` : "—"}
            </span>
            {saison.total > 0 && (
              <span className="text-xs text-muted-foreground">
                sur {saison.total} joueurs
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center gap-0.5 py-3 px-2">
            <Zap className="h-5 w-5 text-primary mb-0.5" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Perf. saison
            </span>
            <span className={`text-xl font-bold tabular-nums ${perfColor(saison.perf_totale)}`}>
              {fmtPerf(saison.perf_totale)}
            </span>
            {saison.perf_totale == null && (
              <span className="text-xs text-muted-foreground">Aucune position</span>
            )}
          </CardContent>
        </Card>
      </div>


      {/* ── Historique des saisons ───────────────────────────── */}
      {historique.length > 0 && (
        <div className="px-4 pb-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Historique
          </h3>
          <div className="flex flex-col gap-2">
            {historique.map((row) => (
              <Card key={row.saison} className="bg-card border-border">
                <CardContent className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      S{row.saison}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {row.nom}
                      </span>
                      {row.rang != null && row.total > 0 && (
                        <span className="text-xs text-muted-foreground">
                          #{row.rang} / {row.total} joueurs
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {row.perf_totale >= 0
                      ? <TrendingUp className="h-4 w-4 text-green-500" />
                      : <TrendingDown className="h-4 w-4 text-red-500" />
                    }
                    <span className={`text-base font-bold tabular-nums ${perfColor(row.perf_totale)}`}>
                      {fmtPerf(row.perf_totale)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Account ──────────────────────────────────────────── */}
      <div className="px-4 py-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Compte
        </h3>
        <div className="flex flex-col gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              className="h-12 justify-between border-border bg-card text-foreground hover:bg-secondary"
              onClick={() => router.push("/admin")}
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-primary" />
                <span>Administration</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          <Button
            variant="outline"
            className="h-12 justify-between border-border bg-card text-foreground hover:bg-secondary"
            onClick={() => router.push("/profil/changer-mot-de-passe")}
          >
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <span>Changer le mot de passe</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            onClick={handleLogOut}
            disabled={loggingOut}
            className="h-12 justify-between border-border bg-card text-foreground hover:bg-secondary disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              {loggingOut
                ? <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                : <LogOut  className="h-5 w-5 text-red-500" />
              }
              <span>{loggingOut ? "Déconnexion…" : "Se déconnecter"}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* ── Bottom nav ───────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center justify-around py-2">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <Home    className="h-5 w-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
          <Link href="/classement" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-medium">Classement</span>
          </Link>
          <Link href="/profil" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    </main>
  )
}
