"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { TrendingUp, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"

export function ConnexionScreen() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (authError) {
      if (authError.message.includes("Invalid login credentials")) {
        setError("Email ou mot de passe incorrect.")
      } else if (authError.message.includes("Email not confirmed")) {
        setError("Confirme ton email avant de te connecter.")
      } else {
        setError(authError.message)
      }
      return
    }

    // Connexion réussie → middleware gère la session, on redirige
    router.push("/dashboard")
    router.refresh()
  }

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
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to continue your streak.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
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
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Connexion…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </main>
  )
}
