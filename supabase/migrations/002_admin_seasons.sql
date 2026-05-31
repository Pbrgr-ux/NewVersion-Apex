-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 002 : Admin + Saisons configurables
-- À exécuter dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. is_admin sur users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ⚠️  Remplace l'email par le tien pour te donner les droits admin
UPDATE public.users SET is_admin = TRUE
WHERE email = 'TON_EMAIL_ICI';


-- 2. Enrichissement de la table saisons
ALTER TABLE public.saisons
  ADD COLUMN IF NOT EXISTS nom                 TEXT,         -- "Saison 2 2026", "Coupe de Printemps"
  ADD COLUMN IF NOT EXISTS type                TEXT DEFAULT 'trimestrielle',  -- trimestrielle | speciale
  ADD COLUMN IF NOT EXISTS capital_initial     DECIMAL(12,2) DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS max_allocation_pct  INT DEFAULT 50,               -- % max par action
  ADD COLUMN IF NOT EXISTS tickers_autorises   TEXT[],       -- NULL = les 65, sinon liste ["AAPL","MSFT"]
  ADD COLUMN IF NOT EXISTS fenetre_jours       INT[],        -- [6,0]=sam-dim · [1,2,3,4,5]=lun-ven
  ADD COLUMN IF NOT EXISTS fenetre_heure_debut INT DEFAULT 21,
  ADD COLUMN IF NOT EXISTS fenetre_heure_fin   INT DEFAULT 23,
  ADD COLUMN IF NOT EXISTS inscription_requise BOOLEAN DEFAULT FALSE;  -- false=auto, true=optionnelle

-- Mettre à jour les saisons existantes avec les valeurs par défaut
UPDATE public.saisons SET
  nom                 = CASE saison_code
    WHEN 'S1' THEN 'Saison 1 — 2026'
    WHEN 'S2' THEN 'Saison 2 — 2026'
    WHEN 'S3' THEN 'Saison 3 — 2026'
    WHEN 'S4' THEN 'Saison 4 — 2026'
  END,
  type                = 'trimestrielle',
  capital_initial     = 100000,
  max_allocation_pct  = 50,
  tickers_autorises   = NULL,           -- tous les 65
  fenetre_jours       = ARRAY[6, 0],    -- sam + dim (prod)
  fenetre_heure_debut = 8,              -- 08:00
  fenetre_heure_fin   = 21,             -- 21:00
  inscription_requise = FALSE
WHERE nom IS NULL;


-- 3. RLS pour is_admin (lecture/écriture admin sur saisons)
-- Les admins peuvent modifier les saisons
CREATE POLICY "saisons_admin_write" ON public.saisons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 002
-- ═══════════════════════════════════════════════════════════
