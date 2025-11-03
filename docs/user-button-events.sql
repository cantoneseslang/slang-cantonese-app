-- ボタン押下ログ用テーブル (Supabase の SQL Editor で実行してください)

CREATE TABLE IF NOT EXISTS user_button_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  button_key TEXT NOT NULL,
  category_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ube_user_id ON user_button_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ube_button_key ON user_button_events(button_key);

ALTER TABLE user_button_events ENABLE ROW LEVEL SECURITY;

-- 自分のログのみ参照可能
CREATE POLICY "Users can view their own button events"
  ON user_button_events FOR SELECT
  USING (auth.uid() = user_id);

-- 自分のログのみ挿入可能
CREATE POLICY "Users can insert their own button events"
  ON user_button_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);



