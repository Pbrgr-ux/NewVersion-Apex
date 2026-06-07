/**
 * lib/leagues.ts  (SERVER-ONLY)
 *
 * Ligues privées = compétitions autonomes (Modèle B) :
 *   • chaque ligue porte sa config (capital, univers, fenêtre, durée)
 *   • portefeuille distinct par (joueur × ligue), scopé par league_id
 *   • perf calculée à la lecture depuis les positions scopées de la ligue
 */

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient }   from "@supabase/supabase-js"
import type { Database }  from "@/types/database"
import { getCurrentSeasonId } from "@/lib/seasons"
import { TICKER_MAP }     from "@/lib/tickers"
import { getLiveQuotes }  from "@/lib/live-quotes"
import { computeChainedPerf, type PerfPosition } from "@/lib/perf"
import { normalizeCode }  from "@/lib/league-codes"

export const MAX_LEAGUES = 3

function admin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Types ──────────────────────────────────────────────────────
export type LeagueConfig = {
  name:                string
  duration_mode:       "fixed" | "permanent"
  debut_date:          string | null
  fin_date:            string | null
  capital_initial:     number
  max_allocation_pct:  number
  tickers_autorises:   string[] | null   // null = toutes
  fenetre_jours:       number[]
  fenetre_heure_debut: number
  fenetre_heure_fin:   number
}

export type LeagueSummary = {
  id:            string
  name:          string
  code:          string
  members:       number
  myRank:        number | null
  isOwner:       boolean
  duration_mode: string
  fin_date:      string | null
  statut:        string
}

export type LeagueMemberRow = {
  user_id:   string
  pseudo:    string
  avatar:    string | null
  is_pro:    boolean
  rang:      number
  perf:      number | null
  isSelf:    boolean
  positions: { ticker: string; name: string; allocation_pct: number }[]  // vide si non-Pro
}

export type LeaguePositionRow = {
  ticker:         string
  name:           string
  allocation_pct: number
  open_price:     number | null
  prix_actuel:    number | null
  variation:      number | null   // % depuis l'ouverture
  pnl_eur:        number | null
}

export type LeagueDetail = {
  id:                  string
  name:                string
  code:                string
  isOwner:             boolean
  isPro:               boolean
  myPositions:         LeaguePositionRow[]
  capital_initial:     number
  max_allocation_pct:  number
  tickers_autorises:   string[] | null
  fenetre_jours:       number[]
  fenetre_heure_debut: number
  fenetre_heure_fin:   number
  duration_mode:       string
  debut_date:          string | null
  fin_date:            string | null
  statut:              string
  members:             LeagueMemberRow[]
}

/** Config d'une ligue nécessaire au sélecteur de contexte d'arbitrage. */
export type LeagueContext = {
  id:                  string
  name:                string
  capital_initial:     number
  max_allocation_pct:  number
  tickers_autorises:   string[] | null
  fenetre_jours:       number[]
  fenetre_heure_debut: number
  fenetre_heure_fin:   number
  statut:              string
}

// 8 lettres (sans I/O ambigus). Stockées sans tiret ; affichées en 4-4.
function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

type DbClient = ReturnType<typeof admin>

function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

/** Une ligue est-elle terminée ? (statut figé OU durée fixe dont la fin est passée) */
export function isLeagueClosed(l: { statut: string; duration_mode: string; fin_date: string | null }): boolean {
  if (l.statut !== "active") return true
  if (l.duration_mode === "fixed" && l.fin_date) return l.fin_date < todayISO()
  return false
}

/**
 * Quotes "gelées" : dernier cours connu ≤ finDate pour chaque ticker.
 * Sert à figer la valorisation des positions ouvertes d'une ligue terminée.
 */
async function frozenQuotes(db: DbClient, tickers: string[], finDate: string): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (tickers.length === 0) return map
  const { data: rows } = await db
    .from("cours")
    .select("ticker, prix, date")
    .in("ticker", tickers)
    .lte("date", finDate)
    .order("date", { ascending: false })
  for (const r of rows ?? []) {
    if (!map.has(r.ticker)) map.set(r.ticker, Number(r.prix))   // 1er = le plus récent ≤ finDate
  }
  return map
}

/**
 * Perf par membre pour une ligue, calculée à la lecture depuis les positions
 * scopées league_id. Si `freezeDate` est fourni (ligue terminée), les positions
 * ouvertes sont valorisées au dernier cours ≤ freezeDate (gel), sinon au prix
 * temps réel. Renvoie une Map<user_id, perf%> (null si pas de données).
 */
type LeaguePos = PerfPosition & { base_capital: number | null }

async function leaguePerfMap(
  db: DbClient,
  leagueId: string,
  freezeDate?: string | null,
): Promise<{ perf: Map<string, number | null>; openByUser: Map<string, LeaguePos[]>; quotes: Map<string, number> }> {
  const { data: positions } = await db
    .from("positions")
    .select("user_id, ticker, allocation_pct, open_price, close_price, status, opened_at, base_capital")
    .eq("league_id", leagueId)

  const byUser = new Map<string, LeaguePos[]>()
  const openTickers = new Set<string>()
  for (const p of positions ?? []) {
    const uid = p.user_id ?? ""
    if (!uid) continue
    if (!byUser.has(uid)) byUser.set(uid, [])
    byUser.get(uid)!.push({
      ticker:         p.ticker,
      allocation_pct: Number(p.allocation_pct),
      open_price:     p.open_price != null ? Number(p.open_price) : null,
      close_price:    p.close_price != null ? Number(p.close_price) : null,
      status:         p.status,
      opened_at:      p.opened_at,
      base_capital:   p.base_capital != null ? Number(p.base_capital) : null,
    })
    if ((p.status ?? "open") === "open") openTickers.add(p.ticker)
  }

  // Ligue terminée → gel sur le dernier cours ≤ fin_date ; sinon prix temps réel.
  const quotes = freezeDate
    ? await frozenQuotes(db, [...openTickers], freezeDate)
    : await getLiveQuotes([...openTickers])

  const perf = new Map<string, number | null>()
  const openByUser = new Map<string, LeaguePos[]>()
  for (const [uid, pos] of byUser) {
    perf.set(uid, computeChainedPerf(pos, quotes))
    openByUser.set(uid, pos.filter((p) => (p.status ?? "open") === "open"))
  }
  return { perf, openByUser, quotes }
}

/** Ligues dont l'utilisateur courant est membre + son rang dans chacune. */
export async function getMyLeagues(): Promise<{ leagues: LeagueSummary[]; userId: string | null; isPro: boolean }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { leagues: [], userId: null, isPro: false }

  const db = admin()
  const { data: dbUser } = await db.from("users").select("is_pro").eq("id", user.id).maybeSingle()
  const isPro = dbUser?.is_pro ?? false

  const { data: memberships } = await db
    .from("league_members")
    .select("league_id")
    .eq("user_id", user.id)

  const leagueIds = (memberships ?? []).map((m) => m.league_id)
  if (leagueIds.length === 0) return { leagues: [], userId: user.id, isPro }

  const [leaguesRes, allMembersRes] = await Promise.all([
    db.from("leagues").select("id, name, code, owner_id, duration_mode, fin_date, statut").in("id", leagueIds),
    db.from("league_members").select("league_id, user_id").in("league_id", leagueIds),
  ])

  const membersByLeague = new Map<string, string[]>()
  for (const m of allMembersRes.data ?? []) {
    if (!membersByLeague.has(m.league_id)) membersByLeague.set(m.league_id, [])
    membersByLeague.get(m.league_id)!.push(m.user_id)
  }

  // Rang interne par perf calculée à la lecture (une passe par ligue)
  const leagues: LeagueSummary[] = []
  for (const l of leaguesRes.data ?? []) {
    const memberIds = membersByLeague.get(l.id) ?? []
    const closed    = isLeagueClosed(l)
    const statut    = closed ? "terminee" : l.statut
    // Persistance paresseuse du statut si la fin est dépassée
    if (closed && l.statut === "active") await db.from("leagues").update({ statut: "terminee" }).eq("id", l.id)

    const { perf } = await leaguePerfMap(db, l.id, closed ? l.fin_date : null)
    const ranked = memberIds
      .map((uid) => ({ uid, perf: perf.get(uid) ?? null }))
      .filter((m) => m.perf !== null)
      .sort((a, b) => (b.perf ?? 0) - (a.perf ?? 0))
    const myRank = ranked.findIndex((m) => m.uid === user.id)
    leagues.push({
      id:            l.id,
      name:          l.name,
      code:          l.code,
      members:       memberIds.length,
      myRank:        myRank >= 0 ? myRank + 1 : null,
      isOwner:       l.owner_id === user.id,
      duration_mode: l.duration_mode,
      fin_date:      l.fin_date,
      statut,
    })
  }

  return { leagues, userId: user.id, isPro }
}

/** Config des ligues actives du joueur pour le sélecteur d'arbitrage. */
export async function getMyLeagueContexts(): Promise<LeagueContext[]> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return []

  const db = admin()
  const { data: memberships } = await db
    .from("league_members")
    .select("league_id")
    .eq("user_id", user.id)
  const leagueIds = (memberships ?? []).map((m) => m.league_id)
  if (leagueIds.length === 0) return []

  const { data: leagues } = await db
    .from("leagues")
    .select("id, name, capital_initial, max_allocation_pct, tickers_autorises, fenetre_jours, fenetre_heure_debut, fenetre_heure_fin, duration_mode, fin_date, statut")
    .in("id", leagueIds)
    .eq("statut", "active")

  // Exclure les ligues à durée fixe dont la fin est dépassée (plus de trading)
  return (leagues ?? [])
    .filter((l) => !isLeagueClosed(l))
    .map((l) => ({
      id:                  l.id,
      name:                l.name,
      capital_initial:     l.capital_initial,
      max_allocation_pct:  l.max_allocation_pct,
      tickers_autorises:   l.tickers_autorises,
      fenetre_jours:       l.fenetre_jours,
      fenetre_heure_debut: l.fenetre_heure_debut,
      fenetre_heure_fin:   l.fenetre_heure_fin,
      statut:              l.statut,
    }))
}

/** Détail d'une ligue : membres classés par perf calculée + positions (Pro). */
export async function getLeagueDetail(leagueId: string): Promise<LeagueDetail | null> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return null

  const db = admin()
  const { data: league } = await db
    .from("leagues")
    .select("id, name, code, owner_id, capital_initial, max_allocation_pct, tickers_autorises, fenetre_jours, fenetre_heure_debut, fenetre_heure_fin, duration_mode, debut_date, fin_date, statut")
    .eq("id", leagueId)
    .maybeSingle()
  if (!league) return null

  // L'utilisateur doit être membre
  const { data: myMembership } = await db
    .from("league_members")
    .select("id").eq("league_id", leagueId).eq("user_id", user.id).maybeSingle()
  if (!myMembership) return null

  const { data: dbUser } = await db.from("users").select("is_pro").eq("id", user.id).maybeSingle()
  const isPro = dbUser?.is_pro ?? false

  // Ligue terminée → gel de la valorisation + persistance du statut
  const closed = isLeagueClosed(league)
  if (closed && league.statut === "active") await db.from("leagues").update({ statut: "terminee" }).eq("id", leagueId)

  const { data: members } = await db.from("league_members").select("user_id").eq("league_id", leagueId)
  const memberIds = (members ?? []).map((m) => m.user_id)

  const [usersRes, perfRes] = await Promise.all([
    db.from("users").select("id, pseudo, avatar, is_pro").in("id", memberIds),
    leaguePerfMap(db, leagueId, closed ? league.fin_date : null),
  ])

  const userOf = new Map(usersRes.data?.map((u) => [u.id, u]) ?? [])
  const { perf, openByUser, quotes } = perfRes

  // Mes positions ouvertes dans cette ligue, valorisées (style dashboard)
  const myPositions: LeaguePositionRow[] = (openByUser.get(user.id) ?? [])
    .sort((a, b) => b.allocation_pct - a.allocation_pct)
    .map((p) => {
      const live = quotes.get(p.ticker) ?? null
      const open = p.open_price
      let variation: number | null = null
      if (live != null && open && open > 0) {
        const ratio = live / open
        if (ratio <= 10 && ratio >= 0.1) variation = parseFloat(((ratio - 1) * 100).toFixed(2))
      }
      const invested = p.base_capital != null ? p.base_capital * (p.allocation_pct / 100) : null
      const pnl = invested != null && variation != null ? Math.round(invested * (variation / 100)) : null
      return {
        ticker:         p.ticker,
        name:           TICKER_MAP[p.ticker]?.name ?? p.ticker,
        allocation_pct: p.allocation_pct,
        open_price:     open,
        prix_actuel:    live,
        variation,
        pnl_eur:        pnl,
      }
    })

  const rows: LeagueMemberRow[] = memberIds
    .map((uid) => ({
      user_id: uid,
      pseudo:  userOf.get(uid)?.pseudo ?? uid,
      avatar:  (userOf.get(uid) as { avatar?: string | null } | undefined)?.avatar ?? null,
      is_pro:  userOf.get(uid)?.is_pro ?? false,
      perf:    perf.get(uid) ?? null,
      isSelf:  uid === user.id,
      // Positions visibles seulement si le demandeur est Pro
      positions: isPro
        ? (openByUser.get(uid) ?? [])
            .sort((a, b) => b.allocation_pct - a.allocation_pct)
            .map((p) => ({ ticker: p.ticker, name: TICKER_MAP[p.ticker]?.name ?? p.ticker, allocation_pct: p.allocation_pct }))
        : [],
    }))
    .sort((a, b) => (b.perf ?? -Infinity) - (a.perf ?? -Infinity))
    .map((m, i) => ({ ...m, rang: i + 1 }))

  return {
    id:                  league.id,
    name:                league.name,
    code:                league.code,
    isOwner:             league.owner_id === user.id,
    isPro,
    myPositions,
    capital_initial:     league.capital_initial,
    max_allocation_pct:  league.max_allocation_pct,
    tickers_autorises:   league.tickers_autorises,
    fenetre_jours:       league.fenetre_jours,
    fenetre_heure_debut: league.fenetre_heure_debut,
    fenetre_heure_fin:   league.fenetre_heure_fin,
    duration_mode:       league.duration_mode,
    debut_date:          league.debut_date,
    fin_date:            league.fin_date,
    statut:              closed ? "terminee" : league.statut,
    members:             rows,
  }
}

/** Crée le portefeuille scopé d'un membre pour une ligue (capital = capital_initial). */
async function createLeaguePortfolio(db: DbClient, userId: string, leagueId: string, saison: number, capital: number) {
  const { data: existing } = await db
    .from("portfolios")
    .select("id").eq("user_id", userId).eq("league_id", leagueId).maybeSingle()
  if (existing) return
  await db.from("portfolios").insert({
    user_id:        userId,
    league_id:      leagueId,
    saison,
    cash:           0,
    capital_initial: capital,
    capital_ajuste:  capital,
    statut_joueur:   "confirmed",
    date_inscription_saison: new Date().toISOString().split("T")[0],
  })
}

/** Crée une ligue (Pro requis, max 3) avec config complète. */
export async function createLeague(config: LeagueConfig): Promise<{ ok: boolean; id?: string; error?: string }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }

  const name = config.name?.trim()
  if (!name) return { ok: false, error: "Name required" }

  const db = admin()
  const { data: dbUser } = await db.from("users").select("is_pro").eq("id", user.id).maybeSingle()
  if (!dbUser?.is_pro) return { ok: false, error: "Pro required to create a league" }

  const { count } = await db.from("league_members").select("id", { count: "exact", head: true }).eq("user_id", user.id)
  if ((count ?? 0) >= MAX_LEAGUES) return { ok: false, error: `Max ${MAX_LEAGUES} leagues at a time` }

  // Code unique
  let code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await db.from("leagues").select("id").eq("code", code).maybeSingle()
    if (!exists) break
    code = genCode()
  }

  const today  = new Date().toISOString().split("T")[0]
  const saison = getCurrentSeasonId()
  const isFixed = config.duration_mode === "fixed"

  const { data: created, error } = await db
    .from("leagues")
    .insert({
      name,
      code,
      owner_id:            user.id,
      saison,
      capital_initial:     config.capital_initial,
      max_allocation_pct:  config.max_allocation_pct,
      tickers_autorises:   config.tickers_autorises,
      fenetre_jours:       config.fenetre_jours,
      fenetre_heure_debut: config.fenetre_heure_debut,
      fenetre_heure_fin:   config.fenetre_heure_fin,
      duration_mode:       config.duration_mode,
      debut_date:          isFixed ? (config.debut_date ?? today) : today,
      fin_date:            isFixed ? config.fin_date : null,
      statut:              "active",
    })
    .select("id")
    .single()
  if (error || !created) {
    console.error("[createLeague] insert leagues failed:", error)
    return { ok: false, error: error?.message ?? "Could not create league" }
  }

  const { error: memErr } = await db.from("league_members").insert({ league_id: created.id, user_id: user.id })
  if (memErr) {
    console.error("[createLeague] insert league_members failed:", memErr)
    await db.from("leagues").delete().eq("id", created.id)
    return { ok: false, error: memErr.message }
  }

  await createLeaguePortfolio(db, user.id, created.id, saison, config.capital_initial)
  return { ok: true, id: created.id }
}

/** Rejoint une ligue via code (max 3) + crée le portefeuille scopé. */
export async function joinLeague(code: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }

  const db = admin()
  const { data: league } = await db
    .from("leagues")
    .select("id, saison, capital_initial, statut")
    .eq("code", normalizeCode(code))
    .maybeSingle()
  if (!league) return { ok: false, error: "Invalid code" }
  if (league.statut !== "active") return { ok: false, error: "This league is closed" }

  const { data: already } = await db.from("league_members").select("id").eq("league_id", league.id).eq("user_id", user.id).maybeSingle()
  if (already) return { ok: true, id: league.id }

  const { count } = await db.from("league_members").select("id", { count: "exact", head: true }).eq("user_id", user.id)
  if ((count ?? 0) >= MAX_LEAGUES) return { ok: false, error: `Max ${MAX_LEAGUES} leagues at a time` }

  await db.from("league_members").insert({ league_id: league.id, user_id: user.id })
  await createLeaguePortfolio(db, user.id, league.id, league.saison, league.capital_initial)
  return { ok: true, id: league.id }
}

/** Quitter une ligue. L'administrateur (owner) ne peut pas quitter sa ligue. */
export async function leaveLeague(leagueId: string): Promise<{ ok: boolean; error?: string }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }
  const db = admin()

  const { data: league } = await db.from("leagues").select("owner_id").eq("id", leagueId).maybeSingle()
  if (league?.owner_id === user.id) {
    return { ok: false, error: "As the admin you can't leave — stop the league instead." }
  }

  await db.from("league_members").delete().eq("league_id", leagueId).eq("user_id", user.id)
  return { ok: true }
}

/** Arrêter une ligue (owner uniquement) : statut terminé + gel au jour J. */
export async function endLeague(leagueId: string): Promise<{ ok: boolean; error?: string }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }
  const db = admin()

  const { data: league } = await db.from("leagues").select("owner_id, statut").eq("id", leagueId).maybeSingle()
  if (!league) return { ok: false, error: "League not found" }
  if (league.owner_id !== user.id) return { ok: false, error: "Only the league admin can stop it" }
  if (league.statut !== "active") return { ok: true }   // déjà terminée

  // fin_date = aujourd'hui → la valorisation est gelée à ce jour (cf. leaguePerfMap)
  await db.from("leagues").update({ statut: "terminee", fin_date: todayISO() }).eq("id", leagueId)
  return { ok: true }
}
