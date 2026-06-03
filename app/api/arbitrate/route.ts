/**
 * POST /api/arbitrate
 *
 * Valide une allocation pour la saison courante avec historisation complète.
 * Body : { allocations: Record<ticker, pct> }
 *
 * Étapes :
 *  1. Auth (session cookie)
 *  2. Prix temps réel (live quotes, refresh lazy ≤ 20 min) pour les tickers visés
 *  3. Récupérer/créer le portfolio de la saison
 *  4. Fermer les positions ouvertes existantes (close_price = quote, closed_at = now)
 *  5. Ouvrir les nouvelles positions (open_price = quote, opened_at = now)
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient }              from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import type { Database }             from "@/types/database"
import { getCurrentSeasonId }        from "@/lib/seasons"
import { getLiveQuotes }             from "@/lib/live-quotes"

function admin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const allocations: Record<string, number> = body?.allocations ?? {}

  const selected = Object.entries(allocations)
    .filter(([, pct]) => Number(pct) > 0)
    .map(([ticker, pct]) => ({ ticker, pct: Number(pct) }))

  if (selected.length === 0) {
    return NextResponse.json({ error: "Pick at least 1 stock" }, { status: 400 })
  }

  const total = selected.reduce((s, p) => s + p.pct, 0)
  if (total > 100) {
    return NextResponse.json({ error: "Total allocation exceeds 100%" }, { status: 400 })
  }

  const db      = admin()
  const saison  = getCurrentSeasonId()
  const nowISO  = new Date().toISOString()

  // 2. Prix temps réel pour les tickers sélectionnés
  const quotes = await getLiveQuotes(selected.map((s) => s.ticker))

  // 3. Récupérer ou créer le portfolio
  let portfolioId: string
  const { data: existing } = await db
    .from("portfolios")
    .select("id")
    .eq("user_id", user.id)
    .eq("saison", saison)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    portfolioId = existing.id
  } else {
    const { data: created, error: cErr } = await db
      .from("portfolios")
      .insert({ user_id: user.id, saison, cash: 0 })
      .select("id")
      .single()
    if (cErr || !created) return NextResponse.json({ error: "Could not create portfolio" }, { status: 500 })
    portfolioId = created.id
  }

  // 4. Fermer les positions ouvertes existantes
  const { data: openPositions } = await db
    .from("positions")
    .select("id, ticker")
    .eq("portfolio_id", portfolioId)
    .eq("status", "open")

  for (const pos of openPositions ?? []) {
    const closePrice = quotes.get(pos.ticker) ?? null
    await db
      .from("positions")
      .update({
        status:      "closed",
        close_price: closePrice,
        closed_at:   nowISO,
      })
      .eq("id", pos.id)
  }

  // 5. Ouvrir les nouvelles positions
  const newRows = selected.map((s) => {
    const price = quotes.get(s.ticker) ?? 0
    return {
      portfolio_id:   portfolioId,
      user_id:        user.id,
      saison,
      ticker:         s.ticker,
      allocation_pct: s.pct,
      prix_achat:     price,        // compat ascendante
      open_price:     price,
      opened_at:      nowISO,
      status:         "open",
    }
  })

  const { error: insErr } = await db.from("positions").insert(newRows)
  if (insErr) return NextResponse.json({ error: "Could not save positions" }, { status: 500 })

  return NextResponse.json({ ok: true, opened: newRows.length, closed: (openPositions ?? []).length })
}
