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
    const cfg = body.config ?? {}
    const r = await createLeague({
      name:                body.name,
      duration_mode:       cfg.duration_mode === "fixed" ? "fixed" : "permanent",
      debut_date:          cfg.debut_date ?? null,
      fin_date:            cfg.fin_date ?? null,
      capital_initial:     Number(cfg.capital_initial) > 0 ? Math.round(Number(cfg.capital_initial)) : 100000,
      max_allocation_pct:  Number(cfg.max_allocation_pct) > 0 ? Math.min(100, Math.round(Number(cfg.max_allocation_pct))) : 50,
      tickers_autorises:   Array.isArray(cfg.tickers_autorises) && cfg.tickers_autorises.length > 0 ? cfg.tickers_autorises : null,
      fenetre_jours:       Array.isArray(cfg.fenetre_jours) && cfg.fenetre_jours.length > 0 ? cfg.fenetre_jours : [6, 0],
      fenetre_heure_debut: Number.isFinite(Number(cfg.fenetre_heure_debut)) ? Number(cfg.fenetre_heure_debut) : 8,
      fenetre_heure_fin:   Number.isFinite(Number(cfg.fenetre_heure_fin)) ? Number(cfg.fenetre_heure_fin) : 21,
    })
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
