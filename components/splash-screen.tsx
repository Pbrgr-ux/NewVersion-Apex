"use client"

import Link from "next/link"
import { AnimatedChart } from "@/components/animated-chart"
import { Button } from "@/components/ui/button"
import { TrendingUp, ChevronRight } from "lucide-react"

export function SplashScreen() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-between overflow-hidden bg-background">
      {/* Animated Chart Background */}
      <div className="absolute inset-0 z-0">
        <AnimatedChart />
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/60" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex w-full max-w-xl flex-1 flex-col items-center justify-between px-6 py-16">
        {/* Logo Section - Top Center */}
        <div className="flex flex-col items-center gap-4 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <TrendingUp className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              TradeLeague
            </h1>
          </div>
        </div>

        {/* Tagline - Center */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground">
            One trade a week.
            <br />
            Real stocks. Real rivals.
            <br />
            <span className="text-primary">No excuses.</span>
          </h2>
        </div>

        {/* CTA Buttons - Bottom */}
        <div className="flex w-full flex-col gap-3 pb-8">
          <Button
            size="lg"
            className="group w-full bg-primary text-primary-foreground hover:bg-primary/90"
            asChild
          >
            <Link href="/signup">
              Get Started
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full border-border bg-secondary/50 text-foreground backdrop-blur-sm hover:bg-secondary"
            asChild
          >
            <Link href="/connexion">Sign In</Link>
          </Button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-0 h-64 w-64 translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
    </main>
  )
}
