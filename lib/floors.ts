/**
 * lib/floors.ts  (SERVER-ONLY)
 *
 * Floors = groupes privés = sous-classements sur la Major League.
 * Aucun portefeuille/arbitrage propre : un Floor n'est qu'un classement privé,
 * filtré sur ses membres, basé sur la perf Major League (table classement).
 *
 * Stockage : réutilise les tables `leagues` (en-tête) + `league_members`.
 */

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient }   from "@supabase/supabase-js"
import type { Database }  from "@/types/database"
import { getCurrentSeasonId } from "@/lib/seasons"
import { TICKER_MAP }     from "@/lib/tickers"
import { getEffectivePro } from "@/lib/pro"
import { normalizeCode }  from "@/lib/league-codes"

export const MAX_FLOORS = 20

function admin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

// ── Types ──────────────────────────────────────────────────────
export type FloorSummary = {
  id:      string
  name:    string
  code:    string
  members: number
  myRank:  number | null
  isOwner: boolean
}

export type FloorMemberRow = {
  user_id:   string
  pseudo:    string
  avatar:    string | null
  is_pro:    boolean
  rang:      number
  perf:      number | null
  isSelf:    boolean
  positions: { ticker: string; name: string; allocation_pct: number }[]  // vide si non-Pro
}

export type FloorDetail = {
  id:      string
  name:    string
  code:    string
  isOwner: boolean
  isPro:   boolean
  members: FloorMemberRow[]
}

type DbClient = ReturnType<typeof admin>

/** Map user_id → perf Major League (saison courante). */
async function seasonPerfMap(db: DbClient, userIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (userIds.length === 0) return map
  const { data } = await db
    .from("classement")
    .select("user_id, perf_totale")
    .eq("saison", getCurrentSeasonId())
    .in("user_id", userIds)
  for (const c of data ?? []) map.set(c.user_id, Number(c.perf_totale))
  return map
}

/** Floors du joueur + son rang interne (perf Major League filtrée sur les membres). */
export async function getMyFloors(): Promise<{ floors: FloorSummary[]; userId: string | null }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { floors: [], userId: null }

  const db = admin()
  const { data: memberships } = await db
    .from("league_members").select("league_id").eq("user_id", user.id)
  const ids = (memberships ?? []).map((m) => m.league_id)
  if (ids.length === 0) return { floors: [], userId: user.id }

  const [floorsRes, allMembersRes] = await Promise.all([
    db.from("leagues").select("id, name, code, owner_id").in("id", ids),
    db.from("league_members").select("league_id, user_id").in("league_id", ids),
  ])

  const membersByFloor = new Map<string, string[]>()
  for (const m of allMembersRes.data ?? []) {
    if (!membersByFloor.has(m.league_id)) membersByFloor.set(m.league_id, [])
    membersByFloor.get(m.league_id)!.push(m.user_id)
  }

  const perf = await seasonPerfMap(db, [...new Set((allMembersRes.data ?? []).map((m) => m.user_id))])

  const floors: FloorSummary[] = (floorsRes.data ?? []).map((f) => {
    const memberIds = membersByFloor.get(f.id) ?? []
    const ranked = memberIds
      .map((uid) => ({ uid, perf: perf.has(uid) ? perf.get(uid)! : null }))
      .filter((m) => m.perf !== null)
      .sort((a, b) => (b.perf ?? 0) - (a.perf ?? 0))
    const myRank = ranked.findIndex((m) => m.uid === user.id)
    return {
      id:      f.id,
      name:    f.name,
      code:    f.code,
      members: memberIds.length,
      myRank:  myRank >= 0 ? myRank + 1 : null,
      isOwner: f.owner_id === user.id,
    }
  })

  return { floors, userId: user.id }
}

/** Détail d'un Floor : membres classés par perf Major League + positions (Pro). */
export async function getFloorDetail(floorId: string): Promise<FloorDetail | null> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return null

  const db = admin()
  const { data: floor } = await db
    .from("leagues").select("id, name, code, owner_id").eq("id", floorId).maybeSingle()
  if (!floor) return null

  const { data: myMembership } = await db
    .from("league_members").select("id").eq("league_id", floorId).eq("user_id", user.id).maybeSingle()
  if (!myMembership) return null

  const { data: dbUser } = await db.from("users").select("is_pro, pro_until").eq("id", user.id).maybeSingle()
  const isPro = getEffectivePro(dbUser)

  const { data: members } = await db.from("league_members").select("user_id").eq("league_id", floorId)
  const memberIds = (members ?? []).map((m) => m.user_id)

  const [usersRes, perf] = await Promise.all([
    db.from("users").select("id, pseudo, avatar, is_pro").in("id", memberIds),
    seasonPerfMap(db, memberIds),
  ])
  const userOf = new Map(usersRes.data?.map((u) => [u.id, u]) ?? [])

  // Positions Major League des membres (seulement si le demandeur est Pro)
  const positionsByUser = new Map<string, { ticker: string; name: string; allocation_pct: number }[]>()
  if (isPro && memberIds.length > 0) {
    const { data: portfolios } = await db
      .from("portfolios")
      .select("user_id, positions ( ticker, allocation_pct, status )")
      .eq("saison", getCurrentSeasonId())
      .is("league_id", null)
      .in("user_id", memberIds)
    for (const p of portfolios ?? []) {
      const pos = ((p.positions ?? []) as Array<{ ticker: string; allocation_pct: number; status?: string }>)
        .filter((x) => (x.status ?? "open") === "open")
        .sort((a, b) => b.allocation_pct - a.allocation_pct)
        .map((x) => ({ ticker: x.ticker, name: TICKER_MAP[x.ticker]?.name ?? x.ticker, allocation_pct: Number(x.allocation_pct) }))
      if (p.user_id) positionsByUser.set(p.user_id, pos)
    }
  }

  const rows: FloorMemberRow[] = memberIds
    .map((uid) => ({
      user_id: uid,
      pseudo:  userOf.get(uid)?.pseudo ?? uid,
      avatar:  (userOf.get(uid) as { avatar?: string | null } | undefined)?.avatar ?? null,
      is_pro:  userOf.get(uid)?.is_pro ?? false,
      perf:    perf.has(uid) ? perf.get(uid)! : null,
      isSelf:  uid === user.id,
      positions: positionsByUser.get(uid) ?? [],
    }))
    .sort((a, b) => (b.perf ?? -Infinity) - (a.perf ?? -Infinity))
    .map((m, i) => ({ ...m, rang: i + 1 }))

  return {
    id:      floor.id,
    name:    floor.name,
    code:    floor.code,
    isOwner: floor.owner_id === user.id,
    isPro,
    members: rows,
  }
}

/** Crée un Floor (gratuit, plafond MAX_FLOORS). */
export async function createFloor(name: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }
  const trimmed = name?.trim()
  if (!trimmed) return { ok: false, error: "Name required" }

  const db = admin()
  const { count } = await db.from("league_members").select("id", { count: "exact", head: true }).eq("user_id", user.id)
  if ((count ?? 0) >= MAX_FLOORS) return { ok: false, error: `Max ${MAX_FLOORS} floors` }

  let code = genCode()
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await db.from("leagues").select("id").eq("code", code).maybeSingle()
    if (!exists) break
    code = genCode()
  }

  const { data: created, error } = await db
    .from("leagues")
    .insert({ name: trimmed, code, owner_id: user.id, saison: getCurrentSeasonId() })
    .select("id").single()
  if (error || !created) {
    console.error("[createFloor]", error)
    return { ok: false, error: error?.message ?? "Could not create floor" }
  }

  const { error: memErr } = await db.from("league_members").insert({ league_id: created.id, user_id: user.id })
  if (memErr) {
    await db.from("leagues").delete().eq("id", created.id)
    return { ok: false, error: memErr.message }
  }
  return { ok: true, id: created.id }
}

/** Rejoint un Floor via code (plafond MAX_FLOORS). */
export async function joinFloor(code: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }

  const db = admin()
  const { data: floor } = await db.from("leagues").select("id").eq("code", normalizeCode(code)).maybeSingle()
  if (!floor) return { ok: false, error: "Invalid code" }

  const { data: already } = await db.from("league_members").select("id").eq("league_id", floor.id).eq("user_id", user.id).maybeSingle()
  if (already) return { ok: true, id: floor.id }

  const { count } = await db.from("league_members").select("id", { count: "exact", head: true }).eq("user_id", user.id)
  if ((count ?? 0) >= MAX_FLOORS) return { ok: false, error: `Max ${MAX_FLOORS} floors` }

  await db.from("league_members").insert({ league_id: floor.id, user_id: user.id })
  return { ok: true, id: floor.id }
}

/** Quitter un Floor (l'admin ne quitte pas — il supprime). */
export async function leaveFloor(floorId: string): Promise<{ ok: boolean; error?: string }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }
  const db = admin()
  const { data: floor } = await db.from("leagues").select("owner_id").eq("id", floorId).maybeSingle()
  if (floor?.owner_id === user.id) return { ok: false, error: "As the admin you can't leave — delete the floor instead." }
  await db.from("league_members").delete().eq("league_id", floorId).eq("user_id", user.id)
  return { ok: true }
}

/** Supprimer un Floor (owner uniquement). Cascade sur league_members. */
export async function deleteFloor(floorId: string): Promise<{ ok: boolean; error?: string }> {
  const server = await createServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }
  const db = admin()
  const { data: floor } = await db.from("leagues").select("owner_id").eq("id", floorId).maybeSingle()
  if (!floor) return { ok: false, error: "Floor not found" }
  if (floor.owner_id !== user.id) return { ok: false, error: "Only the admin can delete the floor" }
  await db.from("leagues").delete().eq("id", floorId)
  return { ok: true }
}
