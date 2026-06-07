/**
 * lib/newsroom-data.ts (SERVER-ONLY)
 *
 * Récupère les actus récentes (news_items) + vérifie le statut Pro.
 */

import { createClient } from "@/lib/supabase/server"
import { TICKER_MAP }   from "@/lib/tickers"
import { getEffectivePro } from "@/lib/pro"

export type NewsRow = {
  ticker:       string
  name:         string
  title:        string
  publisher:    string | null
  url:          string | null
  published_at: string | null
}

export type NewsroomData = {
  isPro: boolean
  items: NewsRow[]
}

export async function getNewsroomData(): Promise<NewsroomData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: dbUser } = await supabase
    .from("users")
    .select("is_pro, pro_until")
    .eq("id", user.id)
    .maybeSingle()

  const isPro = getEffectivePro(dbUser)

  // Inutile de charger les actus si pas Pro (la page redirige/affiche le paywall)
  if (!isPro) return { isPro: false, items: [] }

  const { data } = await supabase
    .from("news_items")
    .select("ticker, title, publisher, url, published_at")
    .order("published_at", { ascending: false })
    .limit(80)

  const items: NewsRow[] = (data ?? []).map((n) => ({
    ticker:       n.ticker,
    name:         TICKER_MAP[n.ticker]?.name ?? n.ticker,
    title:        n.title,
    publisher:    n.publisher,
    url:          n.url,
    published_at: n.published_at,
  }))

  return { isPro: true, items }
}
