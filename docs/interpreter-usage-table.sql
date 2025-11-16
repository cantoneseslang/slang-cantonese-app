-- interpreter_usage テーブル作成
-- 通訳機能の使用回数を記録するテーブル

CREATE TABLE IF NOT EXISTS interpreter_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('cantonese', 'mandarin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_interpreter_usage_user_id ON interpreter_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_interpreter_usage_created_at ON interpreter_usage(created_at);

-- RLSポリシーの有効化
ALTER TABLE interpreter_usage ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のレコードのみ挿入可能
CREATE POLICY "Users can insert their own usage records"
ON interpreter_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のレコードのみ閲覧可能
CREATE POLICY "Users can view their own usage records"
ON interpreter_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ポリシー: 管理者は全てのレコードを閲覧可能
CREATE POLICY "Admins can view all usage records"
ON interpreter_usage
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

