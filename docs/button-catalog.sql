-- ボタンの全体カタログ（未押ボタンの母数に使用）

CREATE TABLE IF NOT EXISTS public.button_catalog (
  button_key TEXT PRIMARY KEY,
  category_id TEXT,
  label TEXT,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_button_catalog_category ON public.button_catalog(category_id);

ALTER TABLE public.button_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read button catalog"
  ON public.button_catalog FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert button catalog"
  ON public.button_catalog FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update button catalog"
  ON public.button_catalog FOR UPDATE USING (true) WITH CHECK (true);


