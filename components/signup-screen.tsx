"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { TrendingUp, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-[var(--signup-blue)] focus:ring-1 focus:ring-[var(--signup-blue)] disabled:opacity-50"

export function SignupScreen() {
  const router = useRouter()
  const supabase = createClient()

  const [pseudo, setPseudo]       = useState("")
  const [email, setEmail]         = useState("")
  const [password, setPassword]   = useState("")
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation basique
    if (pseudo.trim().length < 3) {
      setError("Le pseudo doit faire au moins 3 caractères.")
      return
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Le trigger handle_new_user() lit raw_user_meta_data.pseudo
        data: { pseudo: pseudo.trim() },
      },
    })

    setLoading(false)

    if (authError) {
      // Traduction des erreurs Supabase les plus fréquentes
      if (authError.message.includes("already registered")) {
        setError("Cet email est déjà utilisé.")
      } else if (authError.message.includes("invalid email")) {
        setError("Adresse email invalide.")
      } else {
        setError(authError.message)
      }
      return
    }

    // Supabase envoie un email de confirmation par défaut.
    // Si tu désactives la confirmation dans le dashboard → rediriger directement.
    setSuccess(true)
  }

  // ── Écran de succès ──────────────────────────────────────────
  if (success) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Vérifie ta boîte mail</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Un lien de confirmation a été envoyé à{" "}
          <span className="font-medium text-foreground">{email}</span>.
          Clique dessus pour activer ton compte.
        </p>
        <Link
          href="/connexion"
          className="mt-8 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Aller à la connexion
        </Link>
      </main>
    )
  }

  // ── Formulaire ───────────────────────────────────────────────
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <div className="mb-12 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <TrendingUp className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">TradeLeague</span>
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start competing. One trade changes everything.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Pseudo */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pseudo" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Pseudo
            </label>
            <input
              id="pseudo"
              type="text"
              placeholder="TraderX99"
              autoComplete="username"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              disabled={loading}
              required
              className={INPUT_CLASS}
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className={INPUT_CLASS}
            />
          </div>

          {/* Erreur */}
          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--signup-blue)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Création en cours…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/connexion" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
