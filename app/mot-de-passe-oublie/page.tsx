"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail, CheckCircle2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"

export default function MotDePasseOubliePage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]     = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  // ── Écran de confirmation d'envoi ────────────────────────────
  if (sent) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Mail className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Email envoyé !
        </h1>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">
          Un lien de réinitialisation a été envoyé à{" "}
          <span className="font-medium text-foreground">{email}</span>.
          Vérifie tes spams si tu ne le vois pas.
        </p>
        <Link
          href="/connexion"
          className="mt-8 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Retour à la connexion
        </Link>
      </main>
    )
  }

  // ── Formulaire ───────────────────────────────────────────────
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <TrendingUp className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">TradeLeague</span>
      </div>

      <div className="w-full max-w-sm">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Mot de passe oublié ?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saisis ton email et on t&apos;envoie un lien pour le réinitialiser.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className={INPUT_CLASS}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 w-full text-sm font-semibold disabled:opacity-60"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Envoi en cours…" : "Envoyer le lien"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Tu te souviens ?{" "}
          <Link href="/connexion" className="font-medium text-foreground underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
