-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 013 : bucket Storage pour les avatars
-- À exécuter dans Supabase → SQL Editor.
--
-- Permet aux utilisateurs de charger leur propre photo de profil.
-- Chaque user écrit dans son propre dossier  avatars/{user_id}/...
-- Lecture publique (les avatars s'affichent partout via URL).
-- ═══════════════════════════════════════════════════════════

-- 1. Bucket public "avatars"
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Lecture publique des fichiers du bucket
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 3. Un utilisateur connecté écrit UNIQUEMENT dans son dossier {user_id}/...
--    (le 1er segment du chemin doit être son propre id)
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 013
-- ═══════════════════════════════════════════════════════════
