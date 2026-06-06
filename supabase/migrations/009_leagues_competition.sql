-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 009 : Ligues = compétitions autonomes
-- À exécuter dans Supabase → SQL Editor (après 007).
--
-- Transforme les ligues privées en mini-saisons indépendantes :
--   • chaque ligue porte sa propre config (capital, univers, fenêtre, durée)
--   • portfolios / positions scopés par league_id (NULL = jeu principal)
-- ═══════════════════════════════════════════════════════════

-- ── 1. Config de compétition sur la table leagues ──────────────
ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS capital_initial     INT      NOT NULL DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS max_allocation_pct  INT      NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS tickers_autorises   TEXT[],                      -- NULL = toutes les actions
  ADD COLUMN IF NOT EXISTS fenetre_jours       INT[]    NOT NULL DEFAULT '{6,0}',
  ADD COLUMN IF NOT EXISTS fenetre_heure_debut INT      NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS fenetre_heure_fin   INT      NOT NULL DEFAULT 21,
  ADD COLUMN IF NOT EXISTS duration_mode       TEXT     NOT NULL DEFAULT 'permanent',  -- 'fixed' | 'permanent'
  ADD COLUMN IF NOT EXISTS debut_date          DATE,
  ADD COLUMN IF NOT EXISTS fin_date            DATE,                        -- NULL si permanente
  ADD COLUMN IF NOT EXISTS statut              TEXT     NOT NULL DEFAULT 'active';      -- 'active' | 'terminee'

-- Backfill : les ligues existantes commencent aujourd'hui, permanentes
UPDATE public.leagues
SET debut_date = COALESCE(debut_date, created_at::date)
WHERE debut_date IS NULL;

-- ── 2. Scope league_id sur portfolios ──────────────────────────
ALTER TABLE public.portfolios
  ADD COLUMN IF NOT EXISTS league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE;

-- Remplacer l'unicité (user_id, saison) par deux index partiels :
--   • jeu principal  : un seul portfolio par (user, saison) quand league_id IS NULL
--   • ligue          : un seul portfolio par (user, league)
ALTER TABLE public.portfolios DROP CONSTRAINT IF EXISTS portfolios_user_id_saison_key;
DROP INDEX IF EXISTS public.portfolios_user_id_saison_key;

CREATE UNIQUE INDEX IF NOT EXISTS portfolios_main_uq
  ON public.portfolios (user_id, saison) WHERE league_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS portfolios_league_uq
  ON public.portfolios (user_id, league_id) WHERE league_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS portfolios_league_idx ON public.portfolios (league_id);

-- ── 3. Scope league_id sur positions (dénormalisé) ─────────────
ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS league_id UUID;
CREATE INDEX IF NOT EXISTS positions_league_idx ON public.positions (league_id);

-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 009
-- ═══════════════════════════════════════════════════════════
