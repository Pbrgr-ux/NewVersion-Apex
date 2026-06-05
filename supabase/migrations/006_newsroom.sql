-- ═══════════════════════════════════════════════════════════
-- TradeLeague — Migration 006 : Newsroom
-- À exécuter dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.news_items (
  id           SERIAL PRIMARY KEY,
  ticker       TEXT NOT NULL,
  title        TEXT NOT NULL,
  publisher    TEXT,
  url          TEXT UNIQUE,            -- dédoublonnage par lien
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS news_published_idx ON public.news_items (published_at DESC);
CREATE INDEX IF NOT EXISTS news_ticker_idx    ON public.news_items (ticker);

ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les connectés (la page est Pro-gated côté app)
CREATE POLICY "news_read" ON public.news_items
  FOR SELECT USING (true);

CREATE POLICY "news_service_write" ON public.news_items
  FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════
-- FIN DE MIGRATION 006
-- ═══════════════════════════════════════════════════════════
