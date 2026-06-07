-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 011 : offre fondateurs (Pro gratuit 6 mois)
-- À exécuter dans Supabase → SQL Editor.
--
-- Modèle : chaque compte créé pendant la fenêtre d'éligibilité reçoit
-- automatiquement N mois de Pro (pro_until), comptés depuis SON inscription.
-- L'offre est pilotée par app_config :
--   • founder_offer_until  : date de fin d'éligibilité (NULL = offre OFF)
--   • founder_offer_months : durée offerte en mois (défaut 6)
--
-- Soft-launch : l'offre est OFF par défaut (founder_offer_until = NULL).
-- Pour l'activer à la rentrée (exemple) :
--   update public.app_config set value = '2026-09-01T00:00:00Z',
--          updated_at = now() where key = 'founder_offer_until';
-- Pour la couper : remettre une date passée ou NULL.
-- ═══════════════════════════════════════════════════════════

-- 1. Table de configuration runtime (verrouillée : service_role / SECURITY DEFINER)
CREATE TABLE IF NOT EXISTS public.app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
-- (aucune policy publique → seul le service_role et les fonctions SECURITY DEFINER y accèdent)

INSERT INTO public.app_config (key, value) VALUES
  ('founder_offer_until',  NULL),   -- OFF par défaut ; à activer à la rentrée
  ('founder_offer_months', '6')
ON CONFLICT (key) DO NOTHING;

-- 2. Pro offert par utilisateur jusqu'à cette date (NULL = pas d'offre)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pro_until TIMESTAMPTZ;

-- 3. Attribution auto à l'inscription si l'offre est active
CREATE OR REPLACE FUNCTION public.set_founder_pro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff TIMESTAMPTZ;
  months INT;
BEGIN
  SELECT value::timestamptz INTO cutoff FROM public.app_config WHERE key = 'founder_offer_until';
  SELECT COALESCE(value, '6')::int INTO months FROM public.app_config WHERE key = 'founder_offer_months';
  IF cutoff IS NOT NULL AND now() < cutoff THEN
    NEW.pro_until := now() + make_interval(months => months);
  END IF;
  RETURN NEW;
END;
$$;

-- BEFORE INSERT sur public.users : additif, n'impacte pas handle_new_user
DROP TRIGGER IF EXISTS trg_set_founder_pro ON public.users;
CREATE TRIGGER trg_set_founder_pro
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_founder_pro();

-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 011
-- ═══════════════════════════════════════════════════════════
