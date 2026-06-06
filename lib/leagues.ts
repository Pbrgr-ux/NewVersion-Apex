/**
 * lib/leagues.ts  (SERVER-ONLY)
 *
 * Ligues privées : création (Pro, max 3), adhésion par code, détail.
 */

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient }   from "@supabase/supabase-js"
import type { Database }  from "@/types/database"
import { getCurrentSeasonId } from "@/lib/seasons"
import { TICKER_MAP }     from "@/lib/tickers"

export const MAX_LEAGUES = 3

function admin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type LeagueSummary = {
  id:      string
  name:    string
  code:    string
  members: number
  myRank:  number | null
  isOwner: boolean
}

export type LeagueMemberRow = {
  user_id: string
  pseudo:  string
  avatar:  string | null
  is_pro:  boolean
  rang:    number
  perf:    number | null
  isSelf:  boolean
  positions: { ticker: string; name: string; allocation_pct: number }[]  // vide si non-Pro
}

export type LeagueDetail = {
  id:      string
  name:    string
  code:    string
  isOwner: boolean
  isPro:   boolean
  members: LeagueMemberRow[]
}

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

/** Ligues dont l'utilisateur courant est membre + son rang dans chacune. */
export async function getMyLeagues(): Promise<{ leagues: LeagueSummary[]; userId: string | null }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { leagues: [], userId: null }

  const db = admin()
  const { data: memberships } = await db
    .from("league_members")
    .select("league_id")
    .eq("user_id", user.id)

  const leagueIds = (memberships ?? []).map((m) => m.league_id)
  if (leagueIds.length === 0) return { leagues: [], userId: user.id }

  const [leaguesRes, allMembersRes, classementRes] = await Promise.all([
    db.from("leagues").select("id, name, code, owner_id").in("id", leagueIds),
    db.from("league_members").select("league_id, user_id").in("league_id", leagueIds),
    db.from("classement").select("user_id, perf_totale").eq("saison", getCurrentSeasonId()),
  ])

  const perfOf = new Map<string, number>()
  for (const c of classementRes.data ?? []) perfOf.set(c.user_id, Number(c.perf_totale))

  const membersByLeague = new Map<string, string[]>()
  for (const m of allMembersRes.data ?? []) {
    if (!membersByLeague.has(m.league_id)) membersByLeague.set(m.league_id, [])
    membersByLeague.get(m.league_id)!.push(m.user_id)
  }

  const leagues: LeagueSummary[] = (leaguesRes.data ?? []).map((l) => {
    const memberIds = membersByLeague.get(l.id) ?? []
    // Rang interne = position dans le classement trié des membres par perf
    const ranked = memberIds
      .map((uid) => ({ uid, perf: perfOf.get(uid) ?? null }))
      .filter((m) => m.perf !== null)
      .sort((a, b) => (b.perf ?? 0) - (a.perf ?? 0))
    const myRank = ranked.findIndex((m) => m.uid === user.id)
    return {
      id:      l.id,
      name:    l.name,
      code:    l.code,
      members: memberIds.length,
      myRank:  myRank >= 0 ? myRank + 1 : null,
      isOwner: l.owner_id === user.id,
    }
  })

  return { leagues, userId: user.id }
}

/** Détail d'une ligue : membres classés + positions (Pro uniquement). */
export async function getLeagueDetail(leagueId: string): Promise<LeagueDetail | null> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return null

  const db = admin()
  const { data: league } = await db
    .from("leagues")
    .select("id, name, code, owner_id")
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

  // Membres + users + classement + (Pro) positions
  const { data: members } = await db.from("league_members").select("user_id").eq("league_id", leagueId)
  const memberIds = (members ?? []).map((m) => m.user_id)

  const [usersRes, classRes] = await Promise.all([
    db.from("users").select("id, pseudo, avatar, is_pro").in("id", memberIds),
    db.from("classement").select("user_id, perf_totale").eq("saison", getCurrentSeasonId()).in("user_id", memberIds),
  ])

  const userOf = new Map(usersRes.data?.map((u) => [u.id, u]) ?? [])
  const perfOf = new Map(classRes.data?.map((c) => [c.user_id, Number(c.perf_totale)]) ?? [])

  // Positions des membres (seulement si demandeur Pro)
  const positionsByUser = new Map<string, { ticker: string; name: string; allocation_pct: number }[]>()
  if (isPro) {
    const { data: portfolios } = await db
      .from("portfolios")
      .select("user_id, positions ( ticker, allocation_pct, status )")
      .eq("saison", getCurrentSeasonId())
      .in("user_id", memberIds)
    for (const p of portfolios ?? []) {
      const pos = ((p.positions ?? []) as Array<{ ticker: string; allocation_pct: number; status?: string }>)
        .filter((x) => (x.status ?? "open") === "open")
        .sort((a, b) => b.allocation_pct - a.allocation_pct)
        .map((x) => ({ ticker: x.ticker, name: TICKER_MAP[x.ticker]?.name ?? x.ticker, allocation_pct: Number(x.allocation_pct) }))
      positionsByUser.set(p.user_id, pos)
    }
  }

  const rows: LeagueMemberRow[] = memberIds
    .map((uid) => ({
      user_id: uid,
      pseudo:  userOf.get(uid)?.pseudo ?? uid,
      avatar:  (userOf.get(uid) as { avatar?: string | null } | undefined)?.avatar ?? null,
      is_pro:  userOf.get(uid)?.is_pro ?? false,
      perf:    perfOf.has(uid) ? perfOf.get(uid)! : null,
      isSelf:  uid === user.id,
      positions: positionsByUser.get(uid) ?? [],
    }))
    .sort((a, b) => (b.perf ?? -Infinity) - (a.perf ?? -Infinity))
    .map((m, i) => ({ ...m, rang: i + 1 }))

  return {
    id:      league.id,
    name:    league.name,
    code:    league.code,
    isOwner: league.owner_id === user.id,
    isPro,
    members: rows,
  }
}

/** Crée une ligue (Pro requis, max 3 adhésions). */
export async function createLeague(name: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }

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

  const { data: created, error } = await db
    .from("leagues")
    .insert({ name: name.trim(), code, owner_id: user.id, saison: getCurrentSeasonId() })
    .select("id")
    .single()
  if (error || !created) {
    console.error("[createLeague] insert leagues failed:", error)
    return { ok: false, error: error?.message ?? "Could not create league" }
  }

  const { error: memErr } = await db.from("league_members").insert({ league_id: created.id, user_id: user.id })
  if (memErr) {
    console.error("[createLeague] insert league_members failed:", memErr)
    // rollback de la ligue créée pour ne pas laisser d'orphelin
    await db.from("leagues").delete().eq("id", created.id)
    return { ok: false, error: memErr.message }
  }
  return { ok: true, id: created.id }
}

/** Rejoint une ligue via code (max 3 adhésions). */
export async function joinLeague(code: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }

  const db = admin()
  const { data: league } = await db.from("leagues").select("id").eq("code", code.trim().toUpperCase()).maybeSingle()
  if (!league) return { ok: false, error: "Invalid code" }

  const { data: already } = await db.from("league_members").select("id").eq("league_id", league.id).eq("user_id", user.id).maybeSingle()
  if (already) return { ok: true, id: league.id }

  const { count } = await db.from("league_members").select("id", { count: "exact", head: true }).eq("user_id", user.id)
  if ((count ?? 0) >= MAX_LEAGUES) return { ok: false, error: `Max ${MAX_LEAGUES} leagues at a time` }

  await db.from("league_members").insert({ league_id: league.id, user_id: user.id })
  return { ok: true, id: league.id }
}

/** Quitter une ligue. */
export async function leaveLeague(leagueId: string): Promise<{ ok: boolean }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { ok: false }
  const db = admin()
  await db.from("league_members").delete().eq("league_id", leagueId).eq("user_id", user.id)
  return { ok: true }
}
