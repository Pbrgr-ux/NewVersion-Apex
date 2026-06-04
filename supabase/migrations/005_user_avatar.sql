-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 005 : avatar utilisateur
-- À exécuter dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Avatar : identifiant d'un preset ("preset:fox") ou URL d'image uploadée.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar TEXT;

-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 005
-- ═══════════════════════════════════════════════════════════
