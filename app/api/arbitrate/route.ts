/**
 * POST /api/arbitrate
 *
 * Valide une allocation pour un contexte de compétition (jeu principal OU ligue),
 * avec historisation complète des positions.
 * Body : { allocations: Record<ticker, pct>, leagueId?: string }
 *
 * Jeu principal (leagueId absent) : portfolio scopé league_id IS NULL (saison courante).
 * Ligue (leagueId présent) : config de la ligue (capital, univers, fenêtre, max alloc),
 *   portfolio scopé (user_id, league_id), fenêtre validée côté serveur.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient }              from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import type { Database }             from "@/types/database"
import { getCurrentSeasonId }        from "@/lib/seasons"
import { getLiveQuotes }             from "@/lib/live-quotes"
import { isWindowOpen }              from "@/lib/arbitrage-window"
import { isLeagueClosed }            from "@/lib/leagues"

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
  const leagueId: string | null = typeof body?.leagueId === "string" ? body.leagueId : null

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

  const db     = admin()
  const saison = getCurrentSeasonId()
  const nowISO = new Date().toISOString()

  // 2. Résoudre le contexte (config) ──────────────────────────
  let capitalBaseDefault = 100_000
  let maxAlloc           = 50
  let allowedTickers: Set<string> | null = null

  if (leagueId) {
    // Vérifier l'appartenance
    const { data: membership } = await db
      .from("league_members").select("id").eq("league_id", leagueId).eq("user_id", user.id).maybeSingle()
    if (!membership) return NextResponse.json({ error: "Not a member of this league" }, { status: 403 })

    const { data: league } = await db
      .from("leagues")
      .select("capital_initial, max_allocation_pct, tickers_autorises, fenetre_jours, fenetre_heure_debut, fenetre_heure_fin, duration_mode, fin_date, statut")
      .eq("id", leagueId).maybeSingle()
    if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 })
    if (isLeagueClosed(league)) return NextResponse.json({ error: "This league has ended" }, { status: 400 })

    // Fenêtre validée côté serveur
    const open = isWindowOpen(new Date(), {
      jours:      league.fenetre_jours,
      heureDebut: league.fenetre_heure_debut,
      heureFin:   league.fenetre_heure_fin,
    })
    if (!open) return NextResponse.json({ error: "League trading window is closed" }, { status: 400 })

    capitalBaseDefault = league.capital_initial
    maxAlloc           = league.max_allocation_pct
    allowedTickers     = league.tickers_autorises && league.tickers_autorises.length > 0
      ? new Set(league.tickers_autorises) : null
  }

  // Validation univers + max alloc par action (pour les ligues)
  for (const s of selected) {
    if (allowedTickers && !allowedTickers.has(s.ticker)) {
      return NextResponse.json({ error: `${s.ticker} is not in this league's universe` }, { status: 400 })
    }
    if (s.pct > maxAlloc) {
      return NextResponse.json({ error: `Max ${maxAlloc}% per stock` }, { status: 400 })
    }
  }

  // 3. Récupérer ou créer le portfolio du contexte ────────────
  let portfolioId: string
  let capitalDepart = capitalBaseDefault

  let pq = db.from("portfolios").select("id, capital_ajuste").eq("user_id", user.id)
  pq = leagueId ? pq.eq("league_id", leagueId) : pq.eq("saison", saison).is("league_id", null)
  const { data: existing } = await pq.order("id", { ascending: false }).limit(1).maybeSingle()

  if (existing) {
    portfolioId   = existing.id
    capitalDepart = existing.capital_ajuste != null ? Number(existing.capital_ajuste) : capitalBaseDefault
  } else {
    const { data: created, error: cErr } = await db
      .from("portfolios")
      .insert({
        user_id:         user.id,
        saison,
        league_id:       leagueId,
        cash:            0,
        capital_initial: capitalBaseDefault,
        capital_ajuste:  capitalBaseDefault,
      })
      .select("id")
      .single()
    if (cErr || !created) return NextResponse.json({ error: "Could not create portfolio" }, { status: 500 })
    portfolioId = created.id
  }

  // 4. Positions ouvertes existantes (à fermer) ───────────────
  const { data: openPositions } = await db
    .from("positions")
    .select("id, ticker, allocation_pct, open_price, base_capital")
    .eq("portfolio_id", portfolioId)
    .eq("status", "open")

  // 5. Prix temps réel — tickers sélectionnés + tickers à fermer
  const allTickers = Array.from(new Set([
    ...selected.map((s) => s.ticker),
    ...(openPositions ?? []).map((p) => p.ticker),
  ]))
  const quotes = await getLiveQuotes(allTickers)

  // 6. Base du nouveau batch = valeur du portefeuille maintenant
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
        if (ratio <= 10 && ratio >= 0.1) {
          r += (Number(p.allocation_pct) / 100) * (ratio - 1)
        }
      }
    }
    newBase = openBase * (1 + r)
  }

  // 7. Fermer les positions ouvertes
  for (const pos of openPositions ?? []) {
    await db
      .from("positions")
      .update({ status: "closed", close_price: quotes.get(pos.ticker) ?? null, closed_at: nowISO })
      .eq("id", pos.id)
  }

  // 8. Ouvrir les nouvelles positions avec la base figée
  const baseRounded = Math.round(newBase)
  const newRows = selected.map((s) => {
    const price = quotes.get(s.ticker) ?? 0
    return {
      portfolio_id:   portfolioId,
      user_id:        user.id,
      saison,
      league_id:      leagueId,
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
    ok:           true,
    opened:       newRows.length,
    closed:       (openPositions ?? []).length,
    base_capital: baseRounded,
  })
}
