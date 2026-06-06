-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 008 : verrouiller is_pro / is_admin
-- À exécuter dans Supabase → SQL Editor
--
-- Empêche tout utilisateur de s'auto-attribuer Pro ou Admin depuis le
-- client, même si la policy RLS autorise la mise à jour de sa ligne.
-- (Le droit d'UPDATE au niveau COLONNE prime : sans lui, l'écriture
--  de ces colonnes est refusée par Postgres.)
--
-- Les autres colonnes (avatar, pseudo) restent modifiables.
-- Seul le service_role (clé serveur) peut écrire is_pro / is_admin.
-- ═══════════════════════════════════════════════════════════

REVOKE UPDATE (is_pro, is_admin) ON public.users FROM anon, authenticated;

-- (Optionnel — autoriser explicitement les colonnes éditables par le user)
-- GRANT UPDATE (pseudo, avatar) ON public.users TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 008
-- ═══════════════════════════════════════════════════════════
