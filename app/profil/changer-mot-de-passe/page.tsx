"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"

export default function ChangerMotDePassePage() {
  const router = useRouter()
  const supabase = createClient()

  const [newPassword, setNewPassword]         = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew]                 = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [loading, setLoading]                 = useState(false)
  const [success, setSuccess]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    // Succès — afficher le message 2s puis retour profil
    setSuccess(true)
    setTimeout(() => router.push("/profil"), 2000)
  }

  // ── Écran de succès ──────────────────────────────────────────
  if (success) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
          <CheckCircle2 className="h-10 w-10 text-green-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Mot de passe modifié !
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Retour au profil…
        </p>
      </main>
    )
  }

  // ── Formulaire ───────────────────────────────────────────────
  return (
    <main className="flex min-h-svh flex-col bg-background px-6 pt-12">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Changer le mot de passe</h1>
      </div>

      {/* Icône */}
      <div className="mb-8 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <KeyRound className="h-8 w-8 text-primary" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Nouveau mot de passe */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
              className={INPUT_CLASS + " pr-11"}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
        </div>

        {/* Confirmer */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className={INPUT_CLASS + " pr-11"}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
            {error}
          </p>
        )}

        {/* CTA */}
        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full text-sm font-semibold disabled:opacity-60"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Modification en cours…" : "Enregistrer le nouveau mot de passe"}
        </Button>
      </form>
    </main>
  )
}
