"use client"

import Link from "next/link"
import { usePathname }        from "next/navigation"
import { TrendingUp }         from "lucide-react"
import { useArbitrageWindow } from "@/hooks/use-arbitrage-window"
import type { ArbitrageWindowConfig } from "@/lib/arbitrage-window"

// Pages qui ont déjà leur propre branding centré → pas de header
const HIDDEN_PATHS = ["/", "/signup", "/connexion", "/mot-de-passe-oublie", "/auth/confirmed"]

export function TopHeader({ window }: { window?: ArbitrageWindowConfig }) {
  const pathname  = usePathname()
  const arbitrage = useArbitrageWindow(window)
  if (HIDDEN_PATHS.includes(pathname)) return null

  return (
    <header className="flex items-center justify-between px-4 py-2.5 mb-4 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      {/* Logo cliquable → dashboard */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
          <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground">TradeLeague</span>
      </Link>

      {/* Badge statut fenêtre d'arbitrage */}
      <Link
        href="/arbitrage"
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          arbitrage.isOpen ? "bg-green-500/15 text-green-500" : "bg-secondary text-muted-foreground"
        }`}
      >
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${arbitrage.isOpen ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
        {arbitrage.isOpen
          ? <>Open · {arbitrage.timeUntilClose}</>
          : <>Opens in {arbitrage.timeUntilOpen}</>}
      </Link>
    </header>
  )
}
