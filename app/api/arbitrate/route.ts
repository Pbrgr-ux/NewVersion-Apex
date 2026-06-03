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

  // 2. Récupérer ou créer le portfolio
  let portfolioId: string
  let capitalDepart = 100_000
  const { data: existing } = await db
    .from("portfolios")
    .select("id, capital_ajuste")
    .eq("user_id", user.id)
    .eq("saison", saison)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    portfolioId   = existing.id
    capitalDepart = existing.capital_ajuste ? Number(existing.capital_ajuste) : 100_000
  } else {
    const { data: created, error: cErr } = await db
      .from("portfolios")
      .insert({ user_id: user.id, saison, cash: 0 })
      .select("id")
      .single()
    if (cErr || !created) return NextResponse.json({ error: "Could not create portfolio" }, { status: 500 })
    portfolioId = created.id
  }

  // 3. Positions ouvertes existantes (à fermer)
  const { data: openPositions } = await db
    .from("positions")
    .select("id, ticker, allocation_pct, open_price, base_capital")
    .eq("portfolio_id", portfolioId)
    .eq("status", "open")

  // 4. Prix temps réel — tickers sélectionnés + tickers à fermer
  const allTickers = Array.from(new Set([
    ...selected.map((s) => s.ticker),
    ...(openPositions ?? []).map((p) => p.ticker),
  ]))
  const quotes = await getLiveQuotes(allTickers)

  // 5. Calculer la base du nouveau batch = valeur du portefeuille MAINTENANT
  //    new_base = base_du_batch_ouvert × (1 + rendement réalisé à la clôture)
  let newBase = capitalDepart
  if (openPositions && openPositions.length > 0) {
    const openBase = openPositions[0].base_capital != null
      ? Number(openPositions[0].base_capital)
      : capitalDepart
    let r = 0
    for (const p of openPositions) {
      const close = quotes.get(p.ticker)
      const open  = p.open_price != null ? Number(p.open_price) : null
      if (close != null && open && open > 0) {
        const ratio = close / open
        if (ratio <= 10 && ratio >= 0.1) {           // garde anti-corruption
          r += (Number(p.allocation_pct) / 100) * (ratio - 1)
        }
      }
    }
    newBase = openBase * (1 + r)
  }

  // 6. Fermer les positions ouvertes
  for (const pos of openPositions ?? []) {
    await db
      .from("positions")
      .update({
        status:      "closed",
        close_price: quotes.get(pos.ticker) ?? null,
        closed_at:   nowISO,
      })
      .eq("id", pos.id)
  }

  // 7. Ouvrir les nouvelles positions avec la base figée
  const baseRounded = Math.round(newBase)
  const newRows = selected.map((s) => {
    const price = quotes.get(s.ticker) ?? 0
    return {
      portfolio_id:   portfolioId,
      user_id:        user.id,
      saison,
      ticker:         s.ticker,
      allocation_pct: s.pct,
      prix_achat:     price,
      open_price:     price,
      opened_at:      nowISO,
      status:         "open",
      base_capital:   baseRounded,
    }
  })

  const { error: insErr } = await db.from("positions").insert(newRows)
  if (insErr) return NextResponse.json({ error: "Could not save positions" }, { status: 500 })

  return NextResponse.json({
    ok:          true,
    opened:      newRows.length,
    closed:      (openPositions ?? []).length,
    base_capital: baseRounded,
  })
}
