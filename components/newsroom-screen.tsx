"use client"

import { Newspaper, ExternalLink } from "lucide-react"
import type { NewsRow } from "@/lib/newsroom-data"

function timeAgo(iso: string | null): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function NewsroomScreen({ items }: { items: NewsRow[] }) {
  return (
    <main className="flex min-h-svh flex-col bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-2 pb-3">
        <Newspaper className="h-5 w-5 text-primary" />
        <h1 className="text-base font-bold tracking-tight text-foreground uppercase">Newsroom</h1>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground max-w-[260px]">
            No news yet — the daily briefing runs every evening.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4">
          {items.map((n, i) => (
            <a
              key={i}
              href={n.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
            >
              <span className="mt-0.5 flex h-7 shrink-0 items-center justify-center rounded-md bg-secondary px-2 text-xs font-bold text-foreground">
                {n.ticker}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground leading-snug">{n.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {n.publisher && <span className="truncate">{n.publisher}</span>}
                  {n.publisher && <span>·</span>}
                  <span>{timeAgo(n.published_at)}</span>
                </p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>
      )}
    </main>
  )
}
