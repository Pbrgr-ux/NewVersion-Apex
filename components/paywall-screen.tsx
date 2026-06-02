"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Crown, Check, ShieldCheck, Zap, Users } from "lucide-react"

type Plan = "monthly" | "annual"

const PLANS = {
  monthly: {
    id: "monthly",
    label: "Monthly",
    price: "2,99",
    unit: "/ month",
    sub: null,
    badge: null,
    // In prod: Stripe Price ID for monthly plan
    priceId: "price_monthly_xxx",
    ctaLabel: "Subscribe for €2.99/month",
  },
  annual: {
    id: "annual",
    label: "Annual",
    price: "19,99",
    unit: "/ year",
    sub: "i.e. €1.67/month",
    badge: "−44%",
    // In prod: Stripe Price ID for annual plan
    priceId: "price_annual_xxx",
    ctaLabel: "Subscribe for €19.99/year",
  },
} as const

const FEATURES = [
  {
    icon: Zap,
    title: "Other players. positions",
    description: "See where the best traders invest each week.",
  },
  {
    icon: Users,
    title: "Private leagues with friends",
    description: "Create exclusive competitions and share an invite code.",
  },
  {
    icon: ShieldCheck,
    title: "Ad-free",
    description: "A clean experience, focused on performance.",
  },
]

export function PaywallScreen({ returnTo = "/" }: { returnTo?: string }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Plan>("annual")

  const plan = PLANS[selected]

  function handleSubscribe() {
    // In prod: POST /api/stripe/checkout { priceId: plan.priceId }
    // → redirect to Stripe Checkout URL
    alert(`Stripe Checkout [${plan.priceId}] — to wire in prod.`)
  }

  return (
    <main className="flex min-h-svh flex-col items-center bg-background px-5 pb-10">
      {/* Back */}
      <div className="w-full pt-5">
        <button
          onClick={() => router.back()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Retour
        </button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center gap-3 pt-8 pb-6 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 ring-1 ring-primary/40">
            <Crown className="h-9 w-9 text-primary" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">TradeLeague</p>
          <h1 className="text-3xl font-bold text-foreground">Go Pro</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Unlock everything to dominate the ranking.
          </p>
        </div>
      </div>

      {/* Plan selector */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-6">
        {(["monthly", "annual"] as Plan[]).map((key) => {
          const p = PLANS[key]
          const active = selected === key
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`relative flex flex-col items-center rounded-2xl border px-4 py-4 text-center transition-all active:scale-[0.97] ${
                active
                  ? "border-primary bg-gradient-to-br from-primary/18 to-primary/6 shadow-md shadow-primary/15"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {/* Best-value badge */}
              {p.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground whitespace-nowrap">
                  {p.badge}
                </span>
              )}

              {/* Radio dot */}
              <span
                className={`mb-2 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                  active ? "border-primary" : "border-muted-foreground/40"
                }`}
              >
                {active && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>

              <span className="text-xs font-medium text-muted-foreground mb-1">{p.label}</span>

              <div className="flex items-baseline gap-0.5">
                <span className={`text-2xl font-bold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {p.price}
                </span>
                <span className={`text-sm ${active ? "text-primary" : "text-muted-foreground"}`}>€</span>
              </div>
              <span className="text-xs text-muted-foreground">{p.unit}</span>

              {p.sub && (
                <span className={`mt-1 text-xs font-medium ${active ? "text-primary" : "text-muted-foreground/60"}`}>
                  {p.sub}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Features */}
      <div className="w-full max-w-sm flex flex-col gap-4 mb-8">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
              <Check className="h-3 w-3 text-primary" strokeWidth={3} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <button
          onClick={handleSubscribe}
          className="w-full rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-[0.98]"
        >
          {plan.ctaLabel}
        </button>

        <Link
          href={returnTo}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          No thanks, stay free
        </Link>

        <p className="text-center text-xs text-muted-foreground/60 leading-relaxed max-w-xs">
          Cancel anytime, no commitment.{" "}
          Secure payment via Stripe. By subscribing, you accept our{" "}
          <Link href="#" className="underline underline-offset-2 hover:text-muted-foreground">
            Conditions d'utilisation
          </Link>.
        </p>
      </div>
    </main>
  )
}
