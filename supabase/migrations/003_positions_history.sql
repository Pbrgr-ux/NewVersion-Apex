-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 003 : Historisation des positions
-- À exécuter dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Enrichir la table positions
ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS user_id     UUID,
  ADD COLUMN IF NOT EXISTS saison      INT,
  ADD COLUMN IF NOT EXISTS status      TEXT DEFAULT 'open',   -- 'open' | 'closed'
  ADD COLUMN IF NOT EXISTS open_price  NUMERIC,
  ADD COLUMN IF NOT EXISTS opened_at   TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS close_price NUMERIC,
  ADD COLUMN IF NOT EXISTS closed_at   TIMESTAMPTZ;

-- Migrer les positions existantes : prix_achat → open_price, created_at → opened_at
UPDATE public.positions
SET
  open_price = COALESCE(open_price, prix_achat),
  opened_at  = COALESCE(opened_at, created_at),
  status     = COALESCE(status, 'open')
WHERE open_price IS NULL;

-- Backfill user_id + saison depuis le portfolio parent
UPDATE public.positions p
SET user_id = pf.user_id, saison = pf.saison
FROM public.portfolios pf
WHERE p.portfolio_id = pf.id AND p.user_id IS NULL;

CREATE INDEX IF NOT EXISTS positions_user_status_idx ON public.positions (user_id, saison, status);
CREATE INDEX IF NOT EXISTS positions_opened_idx      ON public.positions (portfolio_id, opened_at);


-- 2. Table quotes_live : prix temps réel (refresh lazy ≤ 20 min)
CREATE TABLE IF NOT EXISTS public.quotes_live (
  ticker     TEXT PRIMARY KEY,
  prix       NUMERIC NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quotes_live ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_live_public_read" ON public.quotes_live
  FOR SELECT USING (true);

CREATE POLICY "quotes_live_service_write" ON public.quotes_live
  FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 003
-- ═══════════════════════════════════════════════════════════
