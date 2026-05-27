-- ============================================================
-- APEX — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. USERS  (profil public — miroir de auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  pseudo      TEXT        NOT NULL UNIQUE,
  is_pro      BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les profils (classement public)
CREATE POLICY "users_select_all" ON public.users
  FOR SELECT USING (true);

-- Chaque utilisateur ne peut modifier que son propre profil
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Trigger : crée automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, pseudo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'pseudo', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 2. PORTFOLIOS  (un portfolio par user par saison)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.portfolios (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  saison      INTEGER     NOT NULL DEFAULT 1,
  cash        NUMERIC(12,2) NOT NULL DEFAULT 100000.00,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, saison)
);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolios_select_own" ON public.portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "portfolios_insert_own" ON public.portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolios_update_own" ON public.portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "portfolios_delete_own" ON public.portfolios
  FOR DELETE USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 3. POSITIONS  (les lignes du portefeuille)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.positions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id    UUID        NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  ticker          TEXT        NOT NULL,
  allocation_pct  NUMERIC(5,2) NOT NULL DEFAULT 0
                  CHECK (allocation_pct >= 0 AND allocation_pct <= 100),
  prix_achat      NUMERIC(12,4) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Helper : vérifie que la position appartient bien à l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.owns_portfolio(p_portfolio_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = p_portfolio_id AND user_id = auth.uid()
  );
$$;

CREATE POLICY "positions_select_own" ON public.positions
  FOR SELECT USING (public.owns_portfolio(portfolio_id));

CREATE POLICY "positions_insert_own" ON public.positions
  FOR INSERT WITH CHECK (public.owns_portfolio(portfolio_id));

CREATE POLICY "positions_update_own" ON public.positions
  FOR UPDATE USING (public.owns_portfolio(portfolio_id));

CREATE POLICY "positions_delete_own" ON public.positions
  FOR DELETE USING (public.owns_portfolio(portfolio_id));


-- ─────────────────────────────────────────────────────────────
-- 4. COURS  (historique des prix — lecture publique)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.cours (
  id      UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker  TEXT    NOT NULL,
  prix    NUMERIC(12,4) NOT NULL,
  date    DATE    NOT NULL,
  UNIQUE (ticker, date)
);

ALTER TABLE public.cours ENABLE ROW LEVEL SECURITY;

-- Prix accessibles à tous (utilisateurs connectés ou non)
CREATE POLICY "cours_select_public" ON public.cours
  FOR SELECT USING (true);

-- Seul le service_role (backend/cron) peut insérer des cours
CREATE POLICY "cours_insert_service" ON public.cours
  FOR INSERT WITH CHECK (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- 5. CLASSEMENT  (mis à jour par un cron ou edge function)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.classement (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  saison      INTEGER     NOT NULL DEFAULT 1,
  perf_totale NUMERIC(8,4) NOT NULL DEFAULT 0,
  rang        INTEGER     NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, saison)
);

ALTER TABLE public.classement ENABLE ROW LEVEL SECURITY;

-- Le classement est public (tout le monde peut voir)
CREATE POLICY "classement_select_public" ON public.classement
  FOR SELECT USING (true);

-- Seul le service_role peut écrire (mise à jour par cron)
CREATE POLICY "classement_write_service" ON public.classement
  FOR ALL USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- Index utiles pour les performances
-- ─────────────────────────────────────────────────────────────
CREATE INDEX idx_portfolios_user_saison  ON public.portfolios (user_id, saison);
CREATE INDEX idx_positions_portfolio     ON public.positions   (portfolio_id);
CREATE INDEX idx_cours_ticker_date       ON public.cours       (ticker, date DESC);
CREATE INDEX idx_classement_saison_rang  ON public.classement  (saison, rang ASC);
