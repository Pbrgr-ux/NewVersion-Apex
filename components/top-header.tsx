"use client"

import { TrendingUp } from "lucide-react"

export function TopHeader() {
  return (
    <header className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
        <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
      </div>
      <span className="text-sm font-bold tracking-tight text-foreground">
        TradeLeague
      </span>
    </header>
  )
}
