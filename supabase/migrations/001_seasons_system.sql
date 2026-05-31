-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 001 : Système de saisons
-- À exécuter dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. TABLE saisons
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saisons (
  id          SERIAL PRIMARY KEY,
  saison_code TEXT UNIQUE NOT NULL,   -- "S1", "S2", "S3", "S4"
  debut_date  DATE NOT NULL,
  fin_date    DATE NOT NULL,
  statut      TEXT NOT NULL DEFAULT 'a_venir',  -- active | terminee | a_venir
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prépeupler les 4 saisons 2026
INSERT INTO public.saisons (saison_code, debut_date, fin_date, statut) VALUES
  ('S1', '2026-01-06', '2026-03-28', 'terminee'),
  ('S2', '2026-04-07', '2026-06-27', 'active'),
  ('S3', '2026-07-07', '2026-09-26', 'a_venir'),
  ('S4', '2026-10-06', '2026-12-26', 'a_venir')
ON CONFLICT (saison_code) DO NOTHING;


-- 2. TABLE palmares_all_time
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.palmares_all_time (
  id                   SERIAL PRIMARY KEY,
  user_id              UUID NOT NULL,
  saison_id            INT NOT NULL,
  rang_final           INT,
  perf_totale          DECIMAL(10,4),
  alpha_positif_weeks  INT DEFAULT 0,
  top10                BOOLEAN DEFAULT FALSE,
  perf_vs_cac40        DECIMAL(10,4),
  perf_vs_sp500        DECIMAL(10,4),
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS palmares_user_idx ON public.palmares_all_time (user_id);


-- 3. TABLE indices
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.indices (
  id                     SERIAL PRIMARY KEY,
  date                   DATE NOT NULL,
  saison_id              INT NOT NULL,
  cac40_prix             DECIMAL(12,4) NOT NULL,
  sp500_prix             DECIMAL(12,4) NOT NULL,
  cac40_variation_saison DECIMAL(10,4) DEFAULT 0,
  sp500_variation_saison DECIMAL(10,4) DEFAULT 0,
  updated_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (date)
);


-- 4. ALTER portfolios — nouvelles colonnes
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.portfolios
  ADD COLUMN IF NOT EXISTS capital_initial        DECIMAL(12,2) DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS capital_ajuste         DECIMAL(12,2) DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS statut_joueur          TEXT DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS date_inscription_saison DATE DEFAULT CURRENT_DATE;

-- Mettre à jour les portfolios existants
UPDATE public.portfolios
SET
  capital_initial        = 100000,
  capital_ajuste         = 100000,
  statut_joueur          = 'confirmed',
  date_inscription_saison = CURRENT_DATE
WHERE capital_initial IS NULL;


-- 5. ALTER classement — nouvelles colonnes
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.classement
  ADD COLUMN IF NOT EXISTS statut_joueur TEXT DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS perf_vs_cac40 DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS perf_vs_sp500 DECIMAL(10,4);

-- Mettre à jour les lignes existantes
UPDATE public.classement
SET statut_joueur = 'confirmed'
WHERE statut_joueur IS NULL;


-- 6. RLS policies pour les nouvelles tables
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.saisons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palmares_all_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indices           ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour saisons et indices (données communes)
CREATE POLICY "saisons_public_read" ON public.saisons
  FOR SELECT USING (true);

CREATE POLICY "indices_public_read" ON public.indices
  FOR SELECT USING (true);

-- Lecture publique pour palmares (classement historique visible de tous)
CREATE POLICY "palmares_public_read" ON public.palmares_all_time
  FOR SELECT USING (true);

-- Écriture service_role uniquement (cron jobs)
CREATE POLICY "palmares_service_insert" ON public.palmares_all_time
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "indices_service_insert" ON public.indices
  FOR ALL USING (auth.role() = 'service_role');


-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 001
-- ═══════════════════════════════════════════════════════════
