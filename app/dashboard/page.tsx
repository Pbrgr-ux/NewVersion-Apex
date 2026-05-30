import { DashboardScreen } from "@/components/dashboard-screen"
import { getDashboardData }  from "@/lib/dashboard-data"

export const dynamic = "force-dynamic" // toujours des données fraîches

export const metadata = {
  title:       "Dashboard | TradeLeague",
  description: "Vue d'ensemble de votre portfolio et performances du marché",
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  return <DashboardScreen data={data} />
}
