import { Skeleton } from "@/components/ui/skeleton"

export default function StockLoading() {
  return (
    <main className="flex min-h-svh flex-col bg-background px-4 pt-2 pb-10">
      <Skeleton className="h-4 w-16 mb-4" />

      {/* Titre + prix */}
      <Skeleton className="h-7 w-24 mb-2" />
      <Skeleton className="h-3 w-40 mb-2" />
      <Skeleton className="h-9 w-36 mb-4" />

      {/* Graphique */}
      <div className="rounded-xl border border-border bg-card p-3 mb-4">
        <Skeleton className="h-3 w-28 mb-2" />
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>

      {/* Ratios */}
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </main>
  )
}
