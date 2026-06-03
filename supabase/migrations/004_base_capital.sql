-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 004 : base_capital par batch d'arbitrage
-- À exécuter dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Valeur du portefeuille au moment de l'arbitrage (base du batch).
-- Permet de calculer les montants en € : valeur position = base × allocation_pct/100.
ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS base_capital NUMERIC;

-- Backfill : les positions existantes prennent 100 000 € comme base
-- (premier arbitrage de saison = capital initial)
UPDATE public.positions
SET base_capital = 100000
WHERE base_capital IS NULL;

-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 004
-- ═══════════════════════════════════════════════════════════
