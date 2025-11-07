-- サブスクリプション有効期限管理のためのマイグレーション

-- 1. subscription_expires_at カラムを追加
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. インデックスを追加（期限切れチェックを高速化）
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires_at 
ON users(subscription_expires_at) 
WHERE subscription_expires_at IS NOT NULL;

-- 3. 期限切れユーザーを自動的にブロンズに戻す関数
CREATE OR REPLACE FUNCTION public.check_and_downgrade_expired_subscriptions()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- 期限切れのサブスクリプション会員をブロンズに戻す
  UPDATE users
  SET 
    membership_type = 'free',
    subscription_expires_at = NULL,
    updated_at = NOW()
  WHERE 
    membership_type = 'subscription'
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at < NOW();
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RETURN QUERY SELECT affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 定期実行用の関数（pg_cronを使用する場合）
-- 注意: Supabaseではpg_cronが利用できない場合があるため、
-- 代わりにSupabase Edge FunctionsまたはVercel Cron Jobsを使用することを推奨

-- 5. テスト用の関数（手動実行用）
CREATE OR REPLACE FUNCTION public.manual_downgrade_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT updated_count INTO affected_count
  FROM public.check_and_downgrade_expired_subscriptions();
  
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



