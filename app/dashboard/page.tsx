import { DashboardScreen } from "@/components/dashboard-screen"
import { getDashboardData }  from "@/lib/dashboard-data"
import { getActiveSeasonWindow } from "@/lib/seasons-server"

export const dynamic = "force-dynamic" // toujours des données fraîches

export const metadata = {
  title:       "Dashboard | TradeLeague",
  description: "Overview of your portfolio and market performance",
}

export default async function DashboardPage() {
  const [data, mainWindow] = await Promise.all([getDashboardData(), getActiveSeasonWindow()])
  return <DashboardScreen data={data} mainWindow={mainWindow} />
}
