"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Crown, LogOut, Calendar, Trophy,
  Zap, ChevronRight,
  Loader2, KeyRound, TrendingUp, TrendingDown,
  Settings, Pencil,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button }            from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge }             from "@/components/ui/badge"
import { createClient }      from "@/lib/supabase/client"
import type { ProfilData }   from "@/lib/profil-data"
import { AVATAR_PRESETS, resolvePreset, isImageUrl } from "@/lib/avatars"

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
  const [pickerOpen, setPickerOpen] = useState(false)
  const [avatar, setAvatar]         = useState<string | null>(data.user.avatar)

  const { user, saison, historique, positions, hasPortfolio } = data
  const { isPro, isAdmin } = user

  const initials    = user.pseudo.slice(0, 2).toUpperCase()
  const memberDate  = new Date(user.memberSince).toLocaleDateString("fr-FR", {
    month: "long", year: "numeric",
  })
  const preset = resolvePreset(avatar)

  async function handleLogOut() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  async function chooseAvatar(presetId: string) {
    const value = `preset:${presetId}`
    setAvatar(value)
    setPickerOpen(false)
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) await supabase.from("users").update({ avatar: value }).eq("id", u.id)
  }

  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">

      {/* ── Header avatar ────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-6">
        <button onClick={() => setPickerOpen(true)} className="relative">
          <Avatar className={`h-24 w-24 border-2 border-primary ${preset ? preset.bg : ""}`}>
            {isImageUrl(avatar) && <AvatarImage src={avatar!} alt={user.pseudo} />}
            <AvatarFallback className={`text-2xl font-bold text-foreground ${preset ? preset.bg : "bg-secondary"}`}>
              {preset ? <span className="text-4xl">{preset.emoji}</span> : initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground border-2 border-background">
            <Pencil className="h-3.5 w-3.5" />
          </span>
        </button>

        {/* Sélecteur d'avatar */}
        {pickerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setPickerOpen(false)}>
            <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-foreground mb-3">Choose your avatar</h3>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => chooseAvatar(p.id)}
                    className={`flex aspect-square items-center justify-center rounded-full text-2xl transition-transform active:scale-90 ${p.bg} ${
                      avatar === `preset:${p.id}` ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    {p.emoji}
                  </button>
                ))}
              </div>
              <button onClick={() => setPickerOpen(false)} className="mt-4 w-full rounded-lg bg-secondary py-2.5 text-sm font-semibold text-foreground">
                Close
              </button>
            </div>
          </div>
        )}

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
            <span>Member since {memberDate}</span>
          </div>
        </div>
      </div>

      {/* ── Classement saison courante ───────────────────────── */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center gap-0.5 py-3 px-2">
            <Trophy className="h-5 w-5 text-primary mb-0.5" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ranking
            </span>
            <span className="text-xl font-bold text-foreground">
              {saison.rang != null ? `#${saison.rang}` : "—"}
            </span>
            {saison.total > 0 && (
              <span className="text-xs text-muted-foreground">
                of {saison.total} players
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center gap-0.5 py-3 px-2">
            <Zap className="h-5 w-5 text-primary mb-0.5" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Season perf
            </span>
            <span className={`text-xl font-bold tabular-nums ${perfColor(saison.perf_totale)}`}>
              {fmtPerf(saison.perf_totale)}
            </span>
            {saison.perf_totale == null && (
              <span className="text-xs text-muted-foreground">No position</span>
            )}
          </CardContent>
        </Card>
      </div>


      {/* ── Historique des saisons ───────────────────────────── */}
      {historique.length > 0 && (
        <div className="px-4 pb-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            History
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
                          #{row.rang} / {row.total} players
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
          Account
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
                <span>Admin</span>
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
              <span>Change password</span>
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
              <span>{loggingOut ? "Signing out…" : "Sign out"}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </main>
  )
}
