/**
 * POST /api/leagues
 * Body : { action: "create" | "join" | "leave", name?, code?, leagueId? }
 */

import { NextRequest, NextResponse } from "next/server"
import { createLeague, joinLeague, leaveLeague } from "@/lib/leagues"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const action = body?.action

  if (action === "create") {
    if (!body?.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })
    const r = await createLeague(body.name)
    return NextResponse.json(r, { status: r.ok ? 200 : 400 })
  }
  if (action === "join") {
    if (!body?.code?.trim()) return NextResponse.json({ error: "Code required" }, { status: 400 })
    const r = await joinLeague(body.code)
    return NextResponse.json(r, { status: r.ok ? 200 : 400 })
  }
  if (action === "leave") {
    if (!body?.leagueId) return NextResponse.json({ error: "leagueId required" }, { status: 400 })
    const r = await leaveLeague(body.leagueId)
    return NextResponse.json(r)
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
