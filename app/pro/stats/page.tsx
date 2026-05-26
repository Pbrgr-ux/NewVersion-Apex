import { Metadata } from "next"
import { StatsProScreen } from "@/components/stats-pro-screen"

export const metadata: Metadata = {
  title: "Stats Pro - APEX",
  description: "Exclusive insights on player allocations and trading patterns",
}

export default function StatsProPage() {
  return <StatsProScreen />
}
