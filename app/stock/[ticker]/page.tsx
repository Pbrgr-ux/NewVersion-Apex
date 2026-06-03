import { notFound }            from "next/navigation"
import { getStockDetail }      from "@/lib/stock-detail"
import { StockDetailScreen }   from "@/components/stock-detail-screen"

export const dynamic = "force-dynamic"

export default async function StockPage({ params }: { params: { ticker: string } }) {
  const ticker = decodeURIComponent(params.ticker).toUpperCase()
  const detail = await getStockDetail(ticker)
  if (!detail) notFound()

  return <StockDetailScreen detail={detail} />
}
