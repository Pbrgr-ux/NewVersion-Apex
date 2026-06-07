-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 010 : corrige le verrou is_pro / is_admin
-- À exécuter dans Supabase → SQL Editor.
--
-- La migration 008 (REVOKE UPDATE (is_pro, is_admin)) était inefficace :
-- Supabase accorde un GRANT UPDATE au niveau de TOUTE la table users aux
-- rôles anon/authenticated. Tant que ce droit table existe, il couvre toutes
-- les colonnes → le REVOKE colonne ne change rien.
--
-- Bonne approche : révoquer l'UPDATE sur la table entière, puis ne ré-accorder
-- l'UPDATE QUE sur les colonnes réellement éditables par l'utilisateur.
-- Côté client, l'app ne met à jour que `avatar` (cf. profil-screen).
-- ═══════════════════════════════════════════════════════════

-- 1. Retirer le droit UPDATE au niveau table (anon + authenticated)
REVOKE UPDATE ON public.users FROM anon, authenticated;

-- 2. Par sécurité, retirer aussi explicitement les colonnes sensibles
REVOKE UPDATE (is_pro, is_admin) ON public.users FROM anon, authenticated;

-- 3. Ré-accorder l'UPDATE uniquement sur les colonnes éditables (authenticated)
--    anon ne peut rien modifier.
GRANT UPDATE (pseudo, avatar) ON public.users TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- Vérification (doit renvoyer 0 ligne après exécution) :
--   select grantee, column_name, privilege_type
--   from information_schema.role_column_grants
--   where table_schema='public' and table_name='users'
--     and column_name in ('is_pro','is_admin')
--     and grantee in ('anon','authenticated') and privilege_type='UPDATE';
-- ═══════════════════════════════════════════════════════════
