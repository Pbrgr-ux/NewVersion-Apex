import { notFound }            from "next/navigation"
import { getStockDetail }      from "@/lib/stock-detail"
import { StockDetailScreen }   from "@/components/stock-detail-screen"

export const dynamic = "force-dynamic"

export default async function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: raw } = await params
  const ticker = decodeURIComponent(raw).toUpperCase()
  const detail = await getStockDetail(ticker)
  if (!detail) notFound()

  return <StockDetailScreen detail={detail} />
}
