/**
 * POST /api/floors
 * Body : { action: "create" | "join" | "leave" | "delete", name?, code?, floorId? }
 */

import { NextRequest, NextResponse } from "next/server"
import { createFloor, joinFloor, leaveFloor, deleteFloor } from "@/lib/floors"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const action = body?.action

  if (action === "create") {
    if (!body?.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })
    const r = await createFloor(body.name)
    return NextResponse.json(r, { status: r.ok ? 200 : 400 })
  }
  if (action === "join") {
    if (!body?.code?.trim()) return NextResponse.json({ error: "Code required" }, { status: 400 })
    const r = await joinFloor(body.code)
    return NextResponse.json(r, { status: r.ok ? 200 : 400 })
  }
  if (action === "leave") {
    if (!body?.floorId) return NextResponse.json({ error: "floorId required" }, { status: 400 })
    const r = await leaveFloor(body.floorId)
    return NextResponse.json(r, { status: r.ok ? 200 : 400 })
  }
  if (action === "delete") {
    if (!body?.floorId) return NextResponse.json({ error: "floorId required" }, { status: 400 })
    const r = await deleteFloor(body.floorId)
    return NextResponse.json(r, { status: r.ok ? 200 : 400 })
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
