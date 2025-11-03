-- お気に入りテーブル作成SQL
-- SupabaseのSQL Editorで実行してください

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_chinese TEXT NOT NULL,
  word_japanese TEXT NOT NULL,
  category_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_chinese, category_id)
);

-- インデックス作成（検索高速化）
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_category_id ON user_favorites(category_id);

-- RLS (Row Level Security) を有効化
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のお気に入りのみアクセス可能
CREATE POLICY "Users can view their own favorites"
  ON user_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);


