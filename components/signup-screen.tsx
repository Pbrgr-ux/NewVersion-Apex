"use client"

import Link from "next/link"
import { TrendingUp } from "lucide-react"

export function SignupScreen() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <div className="mb-12 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <TrendingUp className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">APEX</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start competing. One trade changes everything.
          </p>
        </div>

        <form className="flex flex-col gap-4">
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
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-[var(--signup-blue)] focus:ring-1 focus:ring-[var(--signup-blue)]"
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
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-[var(--signup-blue)] focus:ring-1 focus:ring-[var(--signup-blue)]"
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
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-[var(--signup-blue)] focus:ring-1 focus:ring-[var(--signup-blue)]"
            />
          </div>

          {/* CTA Button */}
          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-[var(--signup-blue)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
          >
            Create Account
          </button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/connexion"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
