import type { Metadata } from "next"
import { ClassementScreen } from "@/components/classement-screen"

export const metadata: Metadata = {
  title: "Classement - APEX",
  description: "Leaderboard and rankings for the current season",
}

export default function ClassementPage() {
  return <ClassementScreen />
}
