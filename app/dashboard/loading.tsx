import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">
      {/* Saison */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-1 w-full mt-3" />
      </div>

      {/* Perfs 2x2 */}
      <div className="grid grid-cols-2 gap-2 px-4 mb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>

      {/* Positions */}
      <div className="px-4">
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Bouton */}
      <div className="px-4 pt-4">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </main>
  )
}
