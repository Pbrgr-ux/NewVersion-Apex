import { Skeleton } from "@/components/ui/skeleton"

export default function ClassementLoading() {
  return (
    <main className="flex min-h-svh flex-col bg-background pb-20">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3 w-40" />
      </div>

      {/* Tabs */}
      <div className="px-4 pb-3">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4">
        <Skeleton className="h-24 w-full rounded-xl mt-6" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl mt-6" />
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </main>
  )
}
