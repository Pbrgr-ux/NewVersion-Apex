-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 012 : pseudo garanti (login social OAuth)
-- À exécuter dans Supabase → SQL Editor.
--
-- Les comptes créés via Google / Microsoft / Facebook n'ont pas de `pseudo`
-- dans les métadonnées → l'insert dans public.users risque de violer la
-- contrainte NOT NULL sur pseudo. Ce trigger BEFORE INSERT remplit le pseudo
-- si absent (préfixe de l'email, sinon "trader"). Additif : ne touche pas
-- handle_new_user.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.ensure_pseudo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pseudo IS NULL OR btrim(NEW.pseudo) = '' THEN
    NEW.pseudo := COALESCE(
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'trader'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_pseudo ON public.users;
CREATE TRIGGER trg_ensure_pseudo
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_pseudo();

-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 012
-- ═══════════════════════════════════════════════════════════
