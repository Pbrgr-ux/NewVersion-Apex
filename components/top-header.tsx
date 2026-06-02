"use client"

import { usePathname } from "next/navigation"
import { TrendingUp }  from "lucide-react"

// Pages qui ont déjà leur propre branding centré → pas de header
const HIDDEN_PATHS = ["/", "/signup", "/connexion", "/mot-de-passe-oublie", "/auth/confirmed"]

export function TopHeader() {
  const pathname = usePathname()
  if (HIDDEN_PATHS.includes(pathname)) return null

  return (
    <header className="flex items-center gap-2 px-4 py-2.5 mb-4 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
        <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
      </div>
      <span className="text-sm font-bold tracking-tight text-foreground">
        TradeLeague
      </span>
    </header>
  )
}
