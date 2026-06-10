import type { Metadata }   from "next"
import { redirect }        from "next/navigation"
import { FloorScreen }     from "@/components/floor-screen"
import { getFloorDetail }  from "@/lib/floors"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Floor - TradeLeague",
  description: "Your private floor standings on the Major League.",
}

export default async function FloorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getFloorDetail(id)
  if (!detail) redirect("/floors")
  return <FloorScreen detail={detail} />
}
