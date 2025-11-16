-- OCR使用履歴テーブル
CREATE TABLE IF NOT EXISTS public.ocr_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_type text NOT NULL CHECK (file_type IN ('image', 'pdf')),
  character_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS有効化
ALTER TABLE public.ocr_usage ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のOCR履歴のみ閲覧可能
CREATE POLICY "Users can view own OCR usage"
  ON public.ocr_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のOCR履歴のみ挿入可能
CREATE POLICY "Users can insert own OCR usage"
  ON public.ocr_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_ocr_usage_user_id ON public.ocr_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_usage_created_at ON public.ocr_usage(created_at);

-- コメント追加
COMMENT ON TABLE public.ocr_usage IS 'OCR（画像・PDF文字認識）の使用履歴を記録';
COMMENT ON COLUMN public.ocr_usage.file_type IS 'ファイルタイプ: image（画像）, pdf（PDF）';
COMMENT ON COLUMN public.ocr_usage.character_count IS '読み取った文字数';
COMMENT ON COLUMN public.ocr_usage.created_at IS '使用日時';

