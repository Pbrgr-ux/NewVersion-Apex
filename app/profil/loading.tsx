import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilLoading() {
  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">
      {/* Avatar + identité */}
      <div className="flex flex-col items-center gap-3 px-6 pt-10 pb-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>

      {/* Ranking / perf */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      {/* History */}
      <div className="px-4">
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  )
}
