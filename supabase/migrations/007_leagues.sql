-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 007 : Ligues privées
-- À exécuter dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.leagues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,      -- code d'invitation
  owner_id    UUID NOT NULL,
  saison      INT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.league_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id  UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (league_id, user_id)
);

CREATE INDEX IF NOT EXISTS league_members_user_idx   ON public.league_members (user_id);
CREATE INDEX IF NOT EXISTS league_members_league_idx ON public.league_members (league_id);

ALTER TABLE public.leagues         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members  ENABLE ROW LEVEL SECURITY;

-- Lecture publique (la logique d'accès est gérée côté serveur service_role)
CREATE POLICY "leagues_read"        ON public.leagues        FOR SELECT USING (true);
CREATE POLICY "league_members_read" ON public.league_members FOR SELECT USING (true);

-- Écriture réservée au service_role (toutes les mutations passent par /api)
CREATE POLICY "leagues_service"        ON public.leagues        FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "league_members_service" ON public.league_members FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 007
-- ═══════════════════════════════════════════════════════════
